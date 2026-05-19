import type { BackgroundToContent, ConversationData, IngestArtifactRequest } from "./types.ts";
import { ingestArtifact, saveConversation } from "./client.ts";

/** Downloads 内のステージングサブパス */
const STAGING_PREFIX = "distill-staging";
/** conv ID が DL 時に確定しない場合の placeholder。サーバが title から逆引きする */
const PENDING_CONV_ID = "_pending";

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

type Source = "claude" | "grok" | "chatgpt";

interface SourceInfo {
  source: Source;
  conversationId: string;
}

function parseConversationUrl(rawUrl: string): SourceInfo | null {
  if (!rawUrl) return null;
  let u: URL;
  try {
    u = new URL(rawUrl);
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

function canonicalHost(host: string): Source | null {
  if (host === "claude.ai" || host.endsWith(".claude.ai")) return "claude";
  if (host === "grok.com" || host.endsWith(".grok.com")) return "grok";
  if (host === "chatgpt.com" || host.endsWith(".chatgpt.com")) return "chatgpt";
  return null;
}

/** referrer がない場合は URL の origin から既知サイトを特定。conv ID は不明のまま返す */
function detectSiteForDownload(item: chrome.downloads.DownloadItem): {
  source: Source;
  conversationId?: string;
} | null {
  const fromReferrer = parseConversationUrl(item.referrer ?? "");
  if (fromReferrer) return fromReferrer;

  const downloadUrl = item.finalUrl || item.url || "";
  let host: string | null = null;
  if (downloadUrl.startsWith("blob:")) {
    try {
      host = new URL(downloadUrl.slice("blob:".length)).hostname;
    } catch {
      host = null;
    }
  } else if (downloadUrl.startsWith("http")) {
    try {
      host = new URL(downloadUrl).hostname;
    } catch {
      host = null;
    }
  }
  if (!host) return null;
  const source = canonicalHost(host);
  return source ? { source } : null;
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
  const detected = detectSiteForDownload(item);
  if (!detected) {
    suggest();
    return false;
  }
  const rawName = basename(item.filename || "artifact");
  const safeName = sanitizePathComponent(rawName, "artifact.html");
  const safeConvId = sanitizePathComponent(detected.conversationId ?? PENDING_CONV_ID, "unknown");
  const filename = `${STAGING_PREFIX}/${detected.source}/${safeConvId}/${safeName}`;
  console.log("Distill: suggesting filename", filename, "(from", rawName, ")");
  suggest({ filename, conflictAction: "overwrite" });
  return false;
});

chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state?.current !== "complete") return;
  void handleDownloadComplete(delta.id);
});

/** 完了したダウンロードのフルパスから staging/{source}/{convId}/{name} を抜き出す */
const STAGING_PATH_RE = new RegExp(
  `[\\\\/]${STAGING_PREFIX}[\\\\/]([^\\\\/]+)[\\\\/]([^\\\\/]+)[\\\\/]([^\\\\/]+)$`,
);

function parseStagingPath(
  fullPath: string,
): { source: Source; conversationId: string | null; originalName: string } | null {
  const m = fullPath.match(STAGING_PATH_RE);
  if (!m) return null;
  const [, source, convIdRaw, originalName] = m;
  if (source !== "claude" && source !== "grok" && source !== "chatgpt") return null;
  const conversationId = convIdRaw === PENDING_CONV_ID ? null : (convIdRaw ?? null);
  return { source, conversationId, originalName: originalName ?? "" };
}

async function handleDownloadComplete(id: number): Promise<void> {
  const [item] = await chrome.downloads.search({ id });
  if (!item) return;
  const parsed = parseStagingPath(item.filename);
  if (!parsed) return;
  console.log("Distill: download complete", item.filename);

  const payload: IngestArtifactRequest = {
    srcPath: item.filename,
    source: parsed.source,
    originalName: parsed.originalName,
    ...(parsed.conversationId ? { conversationId: parsed.conversationId } : {}),
    ...(item.mime ? { mime: item.mime } : {}),
  };
  const res = await ingestArtifact(payload);
  if (!res.success) {
    console.error("Distill: ingest-artifact failed:", res.error);
  } else {
    console.log("Distill: ingested artifact to", res.filePath);
  }
}
