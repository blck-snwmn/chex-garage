import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** ファイルパスを解決する */
export function resolveFilePath(vaultPath: string, source: string, conversationId: string): string {
  return join(vaultPath, "ai-conversations", source.toLowerCase(), `${conversationId}.md`);
}

/** 会話をMarkdownファイルとして書き込む */
export function writeConversation(
  vaultPath: string,
  source: string,
  conversationId: string,
  markdown: string,
): string {
  const filePath = resolveFilePath(vaultPath, source, conversationId);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, markdown, "utf-8");
  return filePath;
}
