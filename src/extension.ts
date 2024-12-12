import * as vscode from "vscode";
import { PromptService } from "./services/promptService";
import * as path from "path";
import { logger } from "./logger";
import { CustomPromptPanel } from "./customPromptPanel";
import { PromptQuickPick } from "./quickpick/promptQuickPick";

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  const promptService = new PromptService(
    context,
    path.join(context.extensionPath, "data", "rules")
  );
 
  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "$(search) Prompts";
  statusBarItem.command = "acp.quickPick";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("acp.quickPick", async () => {
      const quickPick = new PromptQuickPick(promptService);
      await quickPick.show();
    })
  );

  // Register custom prompt command
  context.subscriptions.push(
    vscode.commands.registerCommand("acp.createPrompt", () => {
      CustomPromptPanel.render(context.extensionUri, promptService);
    })
  );

  // Register recent prompts command
  context.subscriptions.push(
    vscode.commands.registerCommand("acp.recentPrompts", async () => {
      const recent = await promptService.getRecentSelections();
      if (recent.length === 0) {
        vscode.window.showInformationMessage("No recent prompts found.");
        return;
      }

      const quickPick = vscode.window.createQuickPick();
      quickPick.items = recent.map((r) => ({
        label: r.title,
        description: new Date(r.timestamp).toLocaleString(),
      }));

      quickPick.onDidChangeSelection(async ([selection]) => {
        if (selection) {
          const prompt = await promptService.getPromptsByTitle(selection.label);
          if (prompt) {
            await vscode.env.clipboard.writeText(prompt.prompt.content);
            quickPick.dispose();
            vscode.window.showInformationMessage("Prompt copied to clipboard!");
          }
        }
      });

      quickPick.show();
    })
  );
}

export function deactivate() {}
