import { atom } from "jotai";

interface VSCodeAPI {
  postMessage(message: unknown): void;
  setState(state: unknown): void;
  getState(): unknown;
}

declare function acquireVsCodeApi(): VSCodeAPI;

type StorageType = "local" | "vscode" | "both";

interface StorageOptions<T> {
  key: string;
  defaultValue: T;
  storageType: StorageType;
}

const vscode = acquireVsCodeApi();

function getStoredValue<T>(key: string, defaultValue: T, storageType: StorageType): T {
  let value = defaultValue;

  if (storageType === "local" || storageType === "both") {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        value = JSON.parse(stored);
      }
    } catch (error) {
      console.warn(`Failed to read from localStorage: ${error}`);
    }
  }

  if (storageType === "vscode" || storageType === "both") {
    const state = vscode.getState() as Record<string, unknown>;
    if (state && state[key] !== undefined) {
      value = state[key] as T;
    }
  }

  return value;
}

function setStoredValue<T>(key: string, value: T, storageType: StorageType): void {
  if (storageType === "local" || storageType === "both") {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to write to localStorage: ${error}`);
    }
  }

  if (storageType === "vscode" || storageType === "both") {
    const state = (vscode.getState() as Record<string, unknown>) || {};
    vscode.setState({ ...state, [key]: value });
  }
}

export function atomWithStorage<T>({ key, defaultValue, storageType }: StorageOptions<T>) {
  const baseAtom = atom<T>(getStoredValue(key, defaultValue, storageType));

  return atom(
    (get) => get(baseAtom),
    (get, set, update: T) => {
      set(baseAtom, update);
      setStoredValue(key, update, storageType);
    }
  );
}
