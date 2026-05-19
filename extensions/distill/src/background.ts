import type { BackgroundToContent, ConversationData, IngestArtifactRequest } from "./types.ts";
import { ingestArtifact, saveConversation } from "./client.ts";

/** Downloads 内のステージングサブパス */
const STAGING_PREFIX = "distill-staging";

async function handleSave(data: ConversationData): Promise<void> {
  const result = await saveConversation(data);

  if (!result.success) {
    console.error("Distill: save failed:", result.error);
  } else {
    console.log("Distill: saved to", result.filePath);
  }
}

chrome.runtime.onMessage.addListener(
  (
    message: ConversationData,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response?: unknown) => void,
  ) => {
    void handleSave(message);
    return undefined;
  },
);

const SITE_SCRIPTS: Record<string, string> = {
  "grok.com": "sites/grok.com/index.js",
  "chatgpt.com": "sites/chatgpt.com/index.js",
};

function getScriptFile(url: string): string | undefined {
  for (const [host, script] of Object.entries(SITE_SCRIPTS)) {
    if (url.includes(host)) return script;
  }
  return undefined;
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id || !tab.url) return;
  const tabId = tab.id;
  const scriptFile = getScriptFile(tab.url);
  if (!scriptFile) return;

  const message: BackgroundToContent = { type: "EXTRACT_AND_SAVE" };
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    console.warn("Distill: content script not ready, injecting and retrying...");
    chrome.scripting
      .executeScript({ target: { tabId }, files: [scriptFile] })
      .then(() => chrome.tabs.sendMessage(tabId, message))
      .catch((err) => console.error("Distill: failed to inject content script:", err));
  });
});

interface SourceInfo {
  source: "claude" | "grok" | "chatgpt";
  conversationId: string;
}

function detectSource(referrer: string): SourceInfo | null {
  if (!referrer) return null;
  let u: URL;
  try {
    u = new URL(referrer);
  } catch {
    return null;
  }
  if (u.hostname === "claude.ai") {
    const m = u.pathname.match(/^\/chat\/([a-zA-Z0-9-]+)/);
    return m?.[1] ? { source: "claude", conversationId: m[1] } : null;
  }
  if (u.hostname === "grok.com") {
    const m = u.pathname.match(/^\/c\/([a-zA-Z0-9-]+)/);
    return m?.[1] ? { source: "grok", conversationId: m[1] } : null;
  }
  if (u.hostname === "chatgpt.com") {
    const m = u.pathname.match(/^\/c\/([a-zA-Z0-9-]+)/);
    return m?.[1] ? { source: "chatgpt", conversationId: m[1] } : null;
  }
  return null;
}

/** Chrome の suggest 用ファイル名: 既知のフォルダ区切りに統一して basename を取り出す */
function basename(filename: string): string {
  const parts = filename.split(/[\\/]/);
  return parts[parts.length - 1] || "artifact";
}

/** Chrome の suggest が許可する文字に絞る（パス区切りや予約文字を除去）。空になったら fallback */
const UNSAFE_PATH_CHARS = ["\\", "/", ":", "*", "?", '"', "<", ">", "|"];
function sanitizePathComponent(name: string, fallback: string): string {
  let clean = name;
  for (const ch of UNSAFE_PATH_CHARS) {
    clean = clean.split(ch).join("");
  }
  clean = clean.replace(/^[.\s]+|[.\s]+$/g, "").trim();
  return clean || fallback;
}

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  const info = detectSource(item.referrer ?? "");
  if (!info) {
    suggest();
    return;
  }
  const rawName = basename(item.filename || "artifact");
  const safeName = sanitizePathComponent(rawName, "artifact.html");
  const safeConvId = sanitizePathComponent(info.conversationId, "unknown");
  const filename = `${STAGING_PREFIX}/${info.source}/${safeConvId}/${safeName}`;
  console.log("Distill: suggesting filename", filename, "(from", rawName, ")");
  suggest({ filename, conflictAction: "overwrite" });
});

chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state?.current !== "complete") return;
  void handleDownloadComplete(delta.id);
});

async function handleDownloadComplete(id: number): Promise<void> {
  const [item] = await chrome.downloads.search({ id });
  if (!item) return;
  // 自分が誘導したステージング配下のファイル以外は無視
  if (
    !item.filename.includes(`/${STAGING_PREFIX}/`) &&
    !item.filename.includes(`\\${STAGING_PREFIX}\\`)
  ) {
    return;
  }
  console.log("Distill: download complete", item.filename);
  const info = detectSource(item.referrer ?? "");
  if (!info) return;

  const payload: IngestArtifactRequest = {
    srcPath: item.filename,
    source: info.source,
    conversationId: info.conversationId,
    originalName: basename(item.filename),
    ...(item.mime ? { mime: item.mime } : {}),
  };
  const res = await ingestArtifact(payload);
  if (!res.success) {
    console.error("Distill: ingest-artifact failed:", res.error);
  } else {
    console.log("Distill: ingested artifact to", res.filePath);
  }
}
