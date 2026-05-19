import type {
  ConversationData,
  IngestArtifactRequest,
  IngestArtifactResponse,
  SaveResponse,
} from "./types.ts";

const DEFAULT_PORT = 18234;

async function getPort(): Promise<number> {
  const result = await chrome.storage.local.get("distillServerPort");
  return (result.distillServerPort as number) ?? DEFAULT_PORT;
}

async function serverUrl(path: string): Promise<string> {
  const port = await getPort();
  return `http://localhost:${String(port)}${path}`;
}

/** distill-serverに会話を保存する */
export async function saveConversation(data: ConversationData): Promise<SaveResponse> {
  const url = await serverUrl("/save");

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

/** ステージングに保存されたアーティファクトを vault へ移動するよう server に依頼する */
export async function ingestArtifact(
  payload: IngestArtifactRequest,
): Promise<IngestArtifactResponse> {
  const url = await serverUrl("/ingest-artifact");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as IngestArtifactResponse | null;
    return {
      success: false,
      error: body?.error ?? `Server returned ${String(res.status)}`,
    };
  }

  return (await res.json()) as IngestArtifactResponse;
}
