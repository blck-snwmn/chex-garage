import type { StorageData } from "../types/index.ts";

export async function getApiKey(): Promise<string | undefined> {
  const result = await chrome.storage.local.get("apiKey");
  return result.apiKey as string | undefined;
}

export async function setApiKey(apiKey: string): Promise<void> {
  await chrome.storage.local.set({ apiKey });
}

export async function getStorageData(): Promise<StorageData> {
  return (await chrome.storage.local.get(["apiKey"])) as StorageData;
}
