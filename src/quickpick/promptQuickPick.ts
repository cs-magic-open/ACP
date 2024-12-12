import * as vscode from "vscode";
import { PromptData } from "../types";
import { QuickPickItem, QuickPickPromptItem } from "./types";
import { formatCount, normalizeTag } from "./utils";
import { PromptService } from "../services/promptService";

export class PromptQuickPick {
  private quickPick: vscode.QuickPick<QuickPickItem>;
  private promptService: PromptService;

  constructor(promptService: PromptService) {
    this.promptService = promptService;
    this.quickPick = vscode.window.createQuickPick<QuickPickItem>();
    this.quickPick.matchOnDescription = true;
    this.quickPick.matchOnDetail = true;
    this.initialize();
  }

  private initialize() {
    this.setMainView();
    this.setupEventHandlers();
  }

  private setMainView() {
    this.quickPick.title = "Select a Prompt";
    this.quickPick.placeholder = "Type to search prompts or browse by category";
    this.quickPick.buttons = [];
  }

  private setCategoryView(label: string) {
    this.quickPick.title = `Prompts • ${label}`;
    this.quickPick.placeholder = "Search prompts in this category";
    this.quickPick.buttons = [vscode.QuickInputButtons.Back];
  }

  private async updateItems(tag?: string) {
    this.quickPick.busy = true;
    this.quickPick.items = await this.getQuickPickItems(tag);
    this.quickPick.busy = false;
  }

  private setupEventHandlers() {
    this.quickPick.onDidChangeSelection(async ([selection]) => {
      if (!selection) return;

      if (selection.type === "tag") {
        this.setCategoryView(selection.label);
        await this.updateItems(selection.label);
      } else if (
        selection.type === "prompt" &&
        (selection as QuickPickPromptItem).rule
      ) {
        const rule = (selection as QuickPickPromptItem).rule;
        await this.handlePromptSelection(rule);
      } else if (selection.label === "$(add) Create New Prompt") {
        await this.handleCustomPrompt();
      }
    });

    this.quickPick.onDidTriggerButton(async (button) => {
      if (button === vscode.QuickInputButtons.Back) {
        this.setMainView();
        await this.updateItems();
      }
    });
  }

  private async handlePromptSelection(rule: PromptData) {
    await vscode.env.clipboard.writeText(rule.prompt.content);
    await this.promptService.addRecentSelection(
      rule.prompt.title,
      rule.prompt.title
    );
    this.quickPick.dispose();

    vscode.window
      .showInformationMessage("Prompt copied to clipboard!", "Open in Editor")
      .then(async (action) => {
        if (action === "Open in Editor") {
          const doc = await vscode.workspace.openTextDocument({
            content: rule.prompt.content,
            language: "markdown",
          });
          await vscode.window.showTextDocument(doc);
        }
      });
  }

  private handleCustomPrompt() {
    this.quickPick.dispose();
    const extensionUri = this.promptService.getExtensionUri();
    vscode.commands.executeCommand('acp.createCustomPrompt', extensionUri);
  }

  public async show() {
    await this.updateItems();
    this.quickPick.show();
  }

  private async getQuickPickItems(
    selectedTag?: string
  ): Promise<QuickPickItem[]> {
    if (selectedTag) {
      return this.getCategoryItems(selectedTag);
    }
    return this.getMainViewItems();
  }

  private async getCategoryItems(tag: string): Promise<QuickPickItem[]> {
    const prompts = await this.promptService.getPromptsByTag(tag);
    return prompts.map((rule) => ({
      type: "prompt" as const,
      label: rule.prompt.title,
      description: "", // Keep title line clean
      detail: [
        rule?.author?.name && `${rule.author.name}`,
        `${rule.prompt.version}`,
        (rule?.prompt?.tags || []).map((t) => `${normalizeTag(t)}`).join(", "),
      ]
        .filter(Boolean)
        .join("$(circle-small-filled)"),
      rule,
    }));
  }

  private async getMainViewItems(): Promise<QuickPickItem[]> {
    const items: QuickPickItem[] = [];

    // Add create custom prompt option
    items.push({
      type: "prompt" as const,
      label: "Create Custom Prompt",
      kind: vscode.QuickPickItemKind.Separator,
      rule: null as any,
    });
    items.push({
      type: "prompt" as const,
      label: "$(add) Create New Prompt",
      description: "", // Keep title line clean
      detail: "Create a custom prompt with your own content",
      kind: vscode.QuickPickItemKind.Default,
      rule: null as any,
    });

    // Add recent items
    const recentItems = await this.getRecentItems();
    if (recentItems.length > 0) {
      items.push({
        type: "prompt" as const,
        label: "Recent",
        kind: vscode.QuickPickItemKind.Separator,
        rule: null as any,
      });
      items.push(...recentItems);
    }

    // Add category items
    const categoryItems = await this.getTagItems();
    if (categoryItems.length > 0) {
      items.push({
        type: "prompt" as const,
        label: "By Tag",
        kind: vscode.QuickPickItemKind.Separator,
        rule: null as any,
      });
      items.push(...categoryItems);
    }

    return items;
  }

  private async getTagItems(): Promise<QuickPickItem[]> {
    const tagCounts = await this.promptService.getTagCounts();
    return [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({
        type: "tag" as const,
        label: normalizeTag(tag),
        tag: tag.toLowerCase(),
        count,
        kind: vscode.QuickPickItemKind.Default,
        description: `$(symbol-tag) (${formatCount(count)})`,
      }));
  }

  private async getRecentItems(): Promise<QuickPickItem[]> {
    const recent = await this.promptService.getRecentSelections();
    if (recent.length === 0) return [];

    const recentWithDetails = await Promise.all(
      recent.slice(0, 5).map(async (r) => {
        const prompt = await this.promptService.getPromptsByTitle(r.title);
        return { ...r, prompt };
      })
    );

    return recentWithDetails.map((rule) => ({
      type: "recent" as const,
      id: rule.title,
      label: rule.title,
      kind: vscode.QuickPickItemKind.Default,
      description: "", // Keep title line clean
      detail: [
        rule.prompt?.author?.name && `${rule.prompt.author.name}`,
        `${rule.prompt?.prompt?.version || ""}`,
        (rule.prompt?.prompt?.tags || [])
          .map((t) => `${normalizeTag(t)}`)
          .join(", "),
      ]
        .filter(Boolean)
        .join("$(circle-small-filled)"),
      timestamp: rule.timestamp,
    }));
  }
}
