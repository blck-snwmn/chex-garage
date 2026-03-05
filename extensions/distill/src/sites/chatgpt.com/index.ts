import type TurndownService from "turndown";
import type { ConversationData, ConversationMessage } from "../../types.ts";
import { createContentScript } from "../content-script-core.ts";
import { fingerprintElements } from "../hash.ts";

function extractTitle(): string {
  const raw = document.title;
  const match = raw.match(/^(.+?)\s*[-–—]\s*ChatGPT$/);
  return match?.[1]?.trim() ?? raw.trim();
}

function extractConversationId(): string | null {
  const match = location.pathname.match(/^\/c\/([a-zA-Z0-9-]+)/);
  return match?.[1] ?? null;
}

function extractMessages(turndown: TurndownService): ConversationMessage[] {
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

createContentScript({
  siteName: "chatgpt.com",
  configureTurndown(td) {
    // ChatGPT コードブロック: <pre> 内の CodeMirror (cm-editor) からコード本文と言語を抽出
    td.addRule("chatgpt-codeblock", {
      filter(node) {
        return node.nodeName === "PRE" && node.querySelector(".cm-content") !== null;
      },
      replacement(_content, node) {
        const el = node as HTMLElement;
        const cmContent = el.querySelector(".cm-content");
        if (!cmContent) return _content;
        const clone = cmContent.cloneNode(true) as HTMLElement;
        for (const br of clone.querySelectorAll("br")) {
          br.replaceWith("\n");
        }
        const code = clone.textContent ?? "";
        const langHeader = el.querySelector("div.sticky");
        const lang = langHeader?.textContent?.trim().toLowerCase() ?? "";
        return `\n\n\`\`\`${lang}\n${code.replace(/\n$/, "")}\n\`\`\`\n\n`;
      },
    });

    // KaTeX インライン数式: <span class="katex"> → $...$
    td.addRule("katex-inline", {
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
    td.addRule("katex-display", {
      filter(node) {
        return node.nodeName === "SPAN" && node.classList.contains("katex-display");
      },
      replacement(_content, node) {
        const tex = (node as HTMLElement).querySelector('annotation[encoding="application/x-tex"]');
        return tex?.textContent ? `\n\n$$\n${tex.textContent}\n$$\n\n` : "";
      },
    });
  },
  extractConversation(turndown): ConversationData | null {
    const conversationId = extractConversationId();
    if (!conversationId) return null;

    const messages = extractMessages(turndown);
    if (messages.length === 0) return null;

    return {
      source: "chatgpt",
      conversationId,
      url: location.href,
      title: extractTitle(),
      messages,
    };
  },
  computeFingerprint(): string {
    return fingerprintElements("[data-message-author-role]");
  },
});
