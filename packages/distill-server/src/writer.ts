import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** ファイルパスを解決する */
export function resolveFilePath(vaultPath: string, source: string, conversationId: string): string {
  return join(vaultPath, "ai-conversations", source.toLowerCase(), `${conversationId}.md`);
}

/** saved_at 行を除去して比較用文字列を返す */
export function stripSavedAt(markdown: string): string {
  return markdown.replace(/^saved_at: .+$/m, "");
}

/** 会話をMarkdownファイルとして書き込む（内容同一ならスキップ） */
export function writeConversation(
  vaultPath: string,
  source: string,
  conversationId: string,
  markdown: string,
): string {
  const filePath = resolveFilePath(vaultPath, source, conversationId);

  try {
    const existing = readFileSync(filePath, "utf-8");
    const strippedNew = stripSavedAt(markdown);
    if (stripSavedAt(existing) === strippedNew) {
      return filePath;
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, markdown, "utf-8");
  return filePath;
}
