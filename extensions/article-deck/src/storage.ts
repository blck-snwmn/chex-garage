import type { StorageData } from "./types.ts";

export async function getApiKey(): Promise<string | undefined> {
  const result = await chrome.storage.local.get("apiKey");
  const apiKey = result.apiKey;
  return typeof apiKey === "string" ? apiKey : undefined;
}

export async function setApiKey(apiKey: string): Promise<void> {
  await chrome.storage.local.set({ apiKey });
}

export async function getStorageData(): Promise<StorageData> {
  const result = await chrome.storage.local.get(["apiKey"]);
  return {
    apiKey: typeof result.apiKey === "string" ? result.apiKey : undefined,
  };
}
