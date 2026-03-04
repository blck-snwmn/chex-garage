import type { ConversationData, SaveResponse } from "./types.ts";

const DEFAULT_PORT = 18234;

async function getPort(): Promise<number> {
  const result = await chrome.storage.local.get("distillServerPort");
  return (result.distillServerPort as number) ?? DEFAULT_PORT;
}

/** distill-serverに会話を保存する */
export async function saveConversation(data: ConversationData): Promise<SaveResponse> {
  const port = await getPort();
  const url = `http://localhost:${String(port)}/save`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as SaveResponse | null;
    return {
      success: false,
      error: body?.error ?? `Server returned ${String(res.status)}`,
    };
  }

  return (await res.json()) as SaveResponse;
}
