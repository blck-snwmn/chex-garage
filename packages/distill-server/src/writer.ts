import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { extractExtraFrontmatter, mergeExtraFrontmatter } from "./formatter.ts";

/** ファイルパスを解決する */
export function resolveFilePath(vaultPath: string, source: string, conversationId: string): string {
  return join(vaultPath, "ai-conversations", source.toLowerCase(), `${conversationId}.md`);
}

/** saved_at 行を除去して比較用文字列を返す */
export function stripSavedAt(markdown: string): string {
  return markdown.replace(/^saved_at: .+$/m, "");
}

/** 会話をMarkdownファイルとして書き込む（内容同一ならスキップ、未知フロントマターは保持） */
export function writeConversation(
  vaultPath: string,
  source: string,
  conversationId: string,
  markdown: string,
): string {
  const filePath = resolveFilePath(vaultPath, source, conversationId);

  // 既存ファイルがある場合: 未知フロントマターを保持しつつ上書き
  try {
    const existing = readFileSync(filePath, "utf-8");
    const extraLines = extractExtraFrontmatter(existing);
    const merged = mergeExtraFrontmatter(markdown, extraLines);
    if (stripSavedAt(existing) === stripSavedAt(merged)) {
      return filePath;
    }
    writeFileSync(filePath, merged, "utf-8");
    return filePath;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }

  // 新規ファイル: ディレクトリごと作成して書き込み
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, markdown, "utf-8");
  return filePath;
}
