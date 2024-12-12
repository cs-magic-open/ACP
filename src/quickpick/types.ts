import * as vscode from "vscode";
import { PromptData } from "../types";

export interface QuickPickPromptItem extends vscode.QuickPickItem {
  type: "prompt";
  rule: PromptData;
}

export interface QuickPickRecentItem extends vscode.QuickPickItem {
  type: "recent";
  id: string;
  timestamp: number;
}

export interface QuickPickTagItem extends vscode.QuickPickItem {
  type: "tag";
  tag: string;
  count: number;
}

export type QuickPickItem = QuickPickPromptItem | QuickPickRecentItem | QuickPickTagItem;
