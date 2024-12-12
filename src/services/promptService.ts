import * as TOML from "@iarna/toml";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import {logger} from "../logger";
import {Prompt, PromptData} from "../types";

export class PromptService {
    private static instance: PromptService;
    private readonly context: vscode.ExtensionContext;
    private readonly rulesDir: string;
    private readonly recentSelectionsKey = "recentSelections";

    public constructor(context: vscode.ExtensionContext, rulesDir: string) {
        this.context = context;
        this.rulesDir = rulesDir;
    }

    public static getInstance(context: vscode.ExtensionContext, rulesDir: string): PromptService {
        if (!PromptService.instance) {
            PromptService.instance = new PromptService(context, rulesDir);
        }
        return PromptService.instance;
    }

    public getExtensionUri(): vscode.Uri {
        return this.context.extensionUri;
    }

    public async getPromptsByTag(tag: string): Promise<PromptData[]> {
        const normalizedSearchTag = tag.toLowerCase();
        const prompts: PromptData[] = [];
        const files = fs.readdirSync(this.rulesDir);

        for (const file of files) {
            if (file.endsWith(".toml")) {
                const rule = await this.loadPromptRule(path.join(this.rulesDir, file));
                if (rule && rule.prompt.tags
                    .map((t) => t.toLowerCase())
                    .includes(normalizedSearchTag)) {
                    prompts.push(rule);
                }
            }
        }

        return prompts;
    }

    public async getRecentSelections(): Promise<{ title: string; timestamp: number }[]> {
        const recent = this.context.globalState.get<{
            title: string; timestamp: number
        }[]>(this.recentSelectionsKey) || [];
        return recent;
    }

    public async addRecentSelection(slug: string, title: string): Promise<void> {
        const recent = await this.getRecentSelections();
        const now = Date.now();

        // Remove existing entry if present
        const index = recent.findIndex((r) => r.title === title);
        if (index !== -1) {
            recent.splice(index, 1);
        }

        // Add to start of array
        recent.unshift({title, timestamp: now});

        // Keep only last 100 items
        if (recent.length > 100) {
            recent.pop();
        }

        await this.context.globalState.update(this.recentSelectionsKey, recent);
    }

    public async getPromptsByTitle(title: string): Promise<PromptData | undefined> {
        const files = fs.readdirSync(this.rulesDir);
        for (const file of files) {
            if (file.endsWith(".toml")) {
                const rule = await this.loadPromptRule(path.join(this.rulesDir, file));
                if (rule && rule.prompt.title === title) {
                    return rule;
                }
            }
        }
        return undefined;
    }

    public async getTagCounts(): Promise<Map<string, number>> {
        const tagCounts = new Map<string, number>();
        const files = fs.readdirSync(this.rulesDir);

        for (const file of files) {
            if (file.endsWith(".toml")) {
                const rule = await this.loadPromptRule(path.join(this.rulesDir, file));
                if (rule) {
                    rule.prompt.tags.forEach((tag) => {
                        const normalizedTag = tag.toLowerCase();
                        tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
                    });
                }
            }
        }

        return tagCounts;
    }

    public async savePrompt(prompt: Prompt): Promise<void> {
        // Here you can implement the actual saving logic
        // For example, saving to a file or sending to a server
        prompt.updatedAt = new Date();
        console.log("Saving prompt:", prompt);
    }

    public generateDefaultVersion(): string {
        return "0.1.0";
    }

    private async loadPromptRule(filePath: string): Promise<PromptData | undefined> {
        try {
            const content = fs.readFileSync(filePath, "utf-8");
            const data = TOML.parse(content) as unknown as PromptData;
            const rule: PromptData = {
                prompt: {
                    title: data.prompt.title,
                    slug: path.basename(filePath, ".toml"),
                    content: data.prompt.content,
                    version: data.prompt.version || "0.1.0",
                    tags: data.prompt.tags || [],
                }, author: data.author,
            };
            return rule;
        } catch (error) {
            logger.error(`Error loading prompt rule from ${filePath}:`, error as Error);
            return undefined;
        }
    }

}

