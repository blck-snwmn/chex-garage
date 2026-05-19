import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join } from "node:path";
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

const UNSAFE_CHARS_RE = /[\\/:*?"<>|]/g;

/** ファイル名をファイルシステムで安全な形にする（拡張子はそのまま） */
export function slugifyArtifactName(originalName: string): string {
  let ext = extname(originalName);
  let base = ext ? originalName.slice(0, -ext.length) : originalName;
  // ".html" のような hidden-file 形式: extname は空を返すが拡張子扱いにする
  if (!ext && /^\.[a-zA-Z0-9]+$/.test(originalName)) {
    ext = originalName;
    base = "";
  }
  const slug = base
    .normalize("NFKC")
    .replace(UNSAFE_CHARS_RE, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .trim();
  return (slug || "artifact") + ext.toLowerCase();
}

export function resolveArtifactPath(
  vaultPath: string,
  source: string,
  conversationId: string,
  originalName: string,
): string {
  return join(
    vaultPath,
    "ai-conversations",
    source.toLowerCase(),
    conversationId,
    slugifyArtifactName(originalName),
  );
}

/** ステージング配下のファイルを vault へ移動する。同 FS なら rename、跨ぐ場合は copy+unlink */
export function ingestArtifact(
  vaultPath: string,
  source: string,
  conversationId: string,
  srcPath: string,
  originalName: string,
): string {
  const destPath = resolveArtifactPath(vaultPath, source, conversationId, originalName);
  mkdirSync(dirname(destPath), { recursive: true });
  try {
    renameSync(srcPath, destPath);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "EXDEV") throw e;
    copyFileSync(srcPath, destPath);
    unlinkSync(srcPath);
  }
  return destPath;
}
