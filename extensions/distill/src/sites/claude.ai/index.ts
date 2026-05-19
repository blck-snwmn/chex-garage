import type TurndownService from "turndown";
import type { ArtifactMeta, ConversationData, ConversationMessage } from "../../types.ts";
import { createContentScript } from "../content-script-core.ts";
import { fingerprintElements } from "../hash.ts";

function extractTitle(): string {
  const raw = document.title;
  const match = raw.match(/^(.+?)\s*[-–—]\s*Claude$/);
  return match?.[1]?.trim() ?? raw.trim();
}

function extractConversationId(): string | null {
  const match = location.pathname.match(/^\/chat\/([a-f0-9-]+)/);
  return match?.[1] ?? null;
}

function extractMessages(turndown: TurndownService): ConversationMessage[] {
  const messages: ConversationMessage[] = [];

  // User messages
  const userEls = document.querySelectorAll<HTMLElement>('[data-testid="user-message"]');

  // Assistant messages: the .standard-markdown inside [data-is-streaming]
  const assistantEls = document.querySelectorAll<HTMLElement>(
    "[data-is-streaming] .standard-markdown",
  );

  // Build an ordered list by document position
  type MessageEntry = { role: "user" | "assistant"; el: HTMLElement };
  const entries: MessageEntry[] = [];

  for (const el of userEls) {
    entries.push({ role: "user", el });
  }
  for (const el of assistantEls) {
    entries.push({ role: "assistant", el });
  }

  // Sort by document order
  entries.sort((a, b) => {
    const pos = a.el.compareDocumentPosition(b.el);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });

  for (const entry of entries) {
    const content = turndown.turndown(entry.el.innerHTML).trim();
    if (!content) continue;
    messages.push({ role: entry.role, content });
  }

  return messages;
}

// 標準アーティファクト用カード: .artifact-block-cell の中にダウンロードボタンがあり、
// aria-label が "<title>をダウンロード" 形式。本体テキストには種別ラベル（"HTML"/"コード"等）が並ぶ
const DOWNLOAD_ARIA_RE = /^(.+?)\s*(?:をダウンロード|を Download|Download)$/i;
const TYPE_LABEL_RE = /[·•・]\s*([\w\-+]+)/;

function extractStandardArtifacts(): ArtifactMeta[] {
  const out: ArtifactMeta[] = [];
  const cells = document.querySelectorAll<HTMLElement>(".artifact-block-cell");
  for (const cell of cells) {
    const dlBtn = cell.querySelector<HTMLButtonElement>(
      'button[aria-label*="ダウンロード"], button[aria-label*="Download"]',
    );
    const aria = dlBtn?.getAttribute("aria-label") ?? "";
    const title = aria.match(DOWNLOAD_ARIA_RE)?.[1]?.trim();
    if (!title) continue;
    const type = (cell.textContent ?? "").match(TYPE_LABEL_RE)?.[1]?.trim() ?? "artifact";
    out.push({ title, type });
  }
  return out;
}

// MCP ウィジェット: mcp-app-container-toolu_XXX の DIV、内部の iframe.title がウィジェット名
function extractMcpArtifacts(): ArtifactMeta[] {
  const out: ArtifactMeta[] = [];
  const containers = document.querySelectorAll<HTMLElement>('[id^="mcp-app-container-"]');
  for (const c of containers) {
    const id = c.id.replace(/^mcp-app-container-/, "");
    const iframe = c.querySelector<HTMLIFrameElement>("iframe");
    const title = iframe?.title?.trim() || id;
    out.push({ id, title, type: "mcp-widget" });
  }
  return out;
}

function extractArtifacts(): ArtifactMeta[] {
  const all = [...extractStandardArtifacts(), ...extractMcpArtifacts()];
  const seen = new Set<string>();
  const dedup: ArtifactMeta[] = [];
  for (const a of all) {
    const key = `${a.id ?? ""}::${a.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(a);
  }
  return dedup;
}

createContentScript({
  siteName: "claude.ai",
  configureTurndown(td) {
    // Exclude thinking/extended thinking containers (row-start-1 in the grid)
    td.addRule("claude-thinking-exclude", {
      filter(node) {
        if (!(node instanceof HTMLElement)) return false;
        return (
          node.classList.contains("row-start-1") &&
          node.classList.contains("col-start-1") &&
          !node.querySelector(".standard-markdown")
        );
      },
      replacement() {
        return "";
      },
    });
  },
  extractConversation(turndown): ConversationData | null {
    const conversationId = extractConversationId();
    if (!conversationId) return null;

    const messages = extractMessages(turndown);
    if (messages.length === 0) return null;

    const artifacts = extractArtifacts();

    return {
      source: "claude",
      conversationId,
      url: location.href,
      title: extractTitle(),
      messages,
      ...(artifacts.length > 0 ? { artifacts } : {}),
    };
  },
  computeFingerprint(): string {
    return fingerprintElements(
      '[data-testid="user-message"], [data-is-streaming] .standard-markdown, .artifact-block-cell, [id^="mcp-app-container-"]',
    );
  },
});
