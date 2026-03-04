import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import type {
  BackgroundToContent,
  ContentToBackground,
  ConversationData,
  ConversationMessage,
} from "../../types.ts";

const DEBOUNCE_MS = 3000;
const POLL_INTERVAL_MS = 2000;

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  hr: "---",
});
turndown.use(gfm);

// ChatGPT コードブロック: <pre> 内の CodeMirror (cm-editor) からコード本文と言語を抽出
turndown.addRule("chatgpt-codeblock", {
  filter(node) {
    return node.nodeName === "PRE" && node.querySelector(".cm-content") !== null;
  },
  replacement(_content, node) {
    const el = node as HTMLElement;
    const cmContent = el.querySelector(".cm-content");
    if (!cmContent) return _content;
    // textContent は <br> を無視するため、先に <br> を "\n" テキストノードに置換してから取得
    const clone = cmContent.cloneNode(true) as HTMLElement;
    for (const br of clone.querySelectorAll("br")) {
      br.replaceWith("\n");
    }
    const code = clone.textContent ?? "";
    // 言語名はヘッダー div.sticky の textContent から取得
    const langHeader = el.querySelector("div.sticky");
    const lang = langHeader?.textContent?.trim().toLowerCase() ?? "";
    return `\n\n\`\`\`${lang}\n${code.replace(/\n$/, "")}\n\`\`\`\n\n`;
  },
});

// KaTeX インライン数式: <span class="katex"> → $...$
turndown.addRule("katex-inline", {
  filter(node) {
    return (
      node.nodeName === "SPAN" &&
      node.classList.contains("katex") &&
      !node.parentElement?.classList.contains("katex-display")
    );
  },
  replacement(_content, node) {
    const tex = (node as HTMLElement).querySelector('annotation[encoding="application/x-tex"]');
    return tex?.textContent ? `$${tex.textContent}$` : "";
  },
});

// KaTeX ブロック数式: <span class="katex-display"> → $$...$$
turndown.addRule("katex-display", {
  filter(node) {
    return node.nodeName === "SPAN" && node.classList.contains("katex-display");
  },
  replacement(_content, node) {
    const tex = (node as HTMLElement).querySelector('annotation[encoding="application/x-tex"]');
    return tex?.textContent ? `\n\n$$\n${tex.textContent}\n$$\n\n` : "";
  },
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastFingerprint = "";
let lastPathname = location.pathname;

/** ページからタイトルを取得する */
function extractTitle(): string {
  const raw = document.title;
  // "Title - ChatGPT" 形式をパース
  const match = raw.match(/^(.+?)\s*[-–—]\s*ChatGPT$/);
  return match?.[1]?.trim() ?? raw.trim();
}

/** モデル名を取得する */
function extractModel(): string {
  const el = document.querySelector<HTMLElement>("[data-testid='model-selector-trigger']");
  return el?.textContent?.trim() ?? "unknown";
}

/** URLからconversation IDを取得する */
function extractConversationId(): string | null {
  const match = location.pathname.match(/^\/c\/([a-zA-Z0-9-]+)/);
  return match?.[1] ?? null;
}

/** 全メッセージをDOMから抽出する */
function extractMessages(): ConversationMessage[] {
  const elements = document.querySelectorAll("[data-message-author-role]");
  const messages: ConversationMessage[] = [];

  for (const el of elements) {
    const authorRole = el.getAttribute("data-message-author-role");
    if (authorRole !== "user" && authorRole !== "assistant") continue;

    const contentEl = el.querySelector(".markdown, .whitespace-pre-wrap");
    if (!contentEl) continue;

    const content = turndown.turndown(contentEl.innerHTML).trim();
    if (!content) continue;

    messages.push({ role: authorRole, content });
  }

  return messages;
}

/** 会話データ全体を抽出する */
function extractConversation(): ConversationData | null {
  const conversationId = extractConversationId();
  if (!conversationId) return null;

  const messages = extractMessages();
  if (messages.length === 0) return null;

  return {
    source: "chatgpt",
    conversationId,
    url: location.href,
    title: extractTitle(),
    model: extractModel(),
    messages,
  };
}

/** メッセージ数+末尾メッセージ長のfingerprintで重複排除する */
function computeFingerprint(): string {
  const elements = document.querySelectorAll("[data-message-author-role]");
  const last = elements[elements.length - 1];
  const lastLength = last?.textContent?.length ?? 0;
  return `${String(elements.length)}:${String(lastLength)}`;
}

function sendToBackground(type: ContentToBackground["type"], data: ConversationData): void {
  const message: ContentToBackground = { type, data };
  chrome.runtime.sendMessage(message).catch(() => {
    // Background service worker が非アクティブの場合は無視
  });
}

function trySave(type: ContentToBackground["type"]): void {
  const data = extractConversation();
  if (!data) return;
  sendToBackground(type, data);
}

function debouncedAutoSave(): void {
  const fingerprint = computeFingerprint();
  if (fingerprint === lastFingerprint) return;
  lastFingerprint = fingerprint;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    trySave("AUTO_SAVE");
  }, DEBOUNCE_MS);
}

/** MutationObserver + pathname監視でauto-saveを実行する */
function init(): void {
  // MutationObserverでDOM変更を監視
  const observer = new MutationObserver(() => {
    debouncedAutoSave();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // SPA対応: pathname変更を検知
  setInterval(() => {
    if (location.pathname !== lastPathname) {
      lastPathname = location.pathname;
      lastFingerprint = "";
      debouncedAutoSave();
    }
  }, POLL_INTERVAL_MS);

  // Background scriptからの手動保存要求に応答
  chrome.runtime.onMessage.addListener(
    (
      message: BackgroundToContent,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void,
    ) => {
      if (message.type === "EXTRACT_AND_SAVE") {
        trySave("SAVE_CONVERSATION");
      }
      return undefined;
    },
  );

  console.log("Distill: content script loaded for chatgpt.com");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
