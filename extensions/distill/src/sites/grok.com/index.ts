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

// 除外要素: thinking-container, inline-media-container, auth-notification
turndown.addRule("grok-exclude", {
  filter(node) {
    if (!(node instanceof HTMLElement)) return false;
    return (
      node.classList.contains("thinking-container") ||
      (node.nodeName === "SECTION" &&
        (node.classList.contains("inline-media-container") ||
          node.classList.contains("auth-notification")))
    );
  },
  replacement() {
    return "";
  },
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastFingerprint = "";
let lastPathname = location.pathname;

/** ページからタイトルを取得する */
function extractTitle(): string {
  const raw = document.title;
  // "Title - Grok" 形式をパース
  const match = raw.match(/^(.+?)\s*[-–—]\s*Grok$/);
  return match?.[1]?.trim() ?? raw.trim();
}

/** URLからconversation IDを取得する */
function extractConversationId(): string | null {
  const match = location.pathname.match(/^\/c\/([a-zA-Z0-9-]+)/);
  return match?.[1] ?? null;
}

/** 全メッセージをDOMから抽出する */
function extractMessages(): ConversationMessage[] {
  const containers = document.querySelectorAll<HTMLElement>(
    ".relative.group.flex.flex-col.justify-center",
  );
  const messages: ConversationMessage[] = [];

  for (const container of containers) {
    const classList = container.className;
    let role: "user" | "assistant";
    if (classList.includes("items-end")) {
      role = "user";
    } else if (classList.includes("items-start")) {
      role = "assistant";
    } else {
      continue;
    }

    const bubble = container.querySelector<HTMLElement>(".message-bubble");
    if (!bubble) continue;

    const content = turndown.turndown(bubble.innerHTML).trim();
    if (!content) continue;

    messages.push({ role, content });
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
    source: "grok",
    conversationId,
    url: location.href,
    title: extractTitle(),
    messages,
  };
}

/** メッセージ数+末尾メッセージ長のfingerprintで重複排除する */
function computeFingerprint(): string {
  const containers = document.querySelectorAll(".relative.group.flex.flex-col.justify-center");
  const last = containers[containers.length - 1];
  const lastLength = last?.textContent?.length ?? 0;
  return `${String(containers.length)}:${String(lastLength)}`;
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

  // タブがアクティブになったときに保存（変更がある場合のみ）
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      debouncedAutoSave();
    }
  });

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

  // ページ読み込み時に初回保存をトリガー
  debouncedAutoSave();

  console.log("Distill: content script loaded for grok.com");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
