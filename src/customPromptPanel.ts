import * as vscode from "vscode";
import { PromptService } from "./services/promptService";
import { Prompt } from "./types";

export class CustomPromptPanel {
  public static currentPanel: CustomPromptPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private readonly _promptService: PromptService;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    promptService: PromptService
  ) {
    this._panel = panel;
    this._promptService = promptService;

    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri
    );

    // Set up listeners
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._setWebviewMessageListener(this._panel.webview);
  }

  public static render(extensionUri: vscode.Uri, promptService: PromptService) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (CustomPromptPanel.currentPanel) {
      CustomPromptPanel.currentPanel._panel.reveal(column);
    } else {
      const panel = vscode.window.createWebviewPanel(
        "customPrompt",
        "Create Custom Prompt",
        column || vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, "out", "webview"),
          ],
        }
      );

      CustomPromptPanel.currentPanel = new CustomPromptPanel(
        panel,
        extensionUri,
        promptService
      );
    }
  }

  public dispose() {
    CustomPromptPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private async _handlePromptSubmission(prompt: Prompt) {
    try {
      await this._promptService.savePrompt(prompt);
      vscode.window.showInformationMessage(
        `Prompt "${prompt.title}" saved successfully!`
      );
      this._panel.dispose();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to save prompt: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private _getWebviewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, "out", "webview", "app.js")
    );

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline' 'unsafe-eval' ${webview.cspSource};">
      <title>Custom Prompt</title>
      <script src="${scriptUri}"></script>

    </head>
    <body>
      <div id="root"></div>
    </body>
    </html>`;
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "submitPrompt": {
            await this._handlePromptSubmission(message.promptRule);
            break;
          }
        }
      },
      undefined,
      this._disposables
    );
  }
}
