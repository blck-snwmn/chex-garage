import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync as fsWriteFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  findConversationByArtifactTitle,
  ingestArtifact,
  resolveArtifactPath,
  resolveFilePath,
  slugifyArtifactName,
  stripSavedAt,
  writeConversation,
} from "./writer.ts";

describe("resolveFilePath", () => {
  it("正しいファイルパスを生成する", () => {
    const result = resolveFilePath("/vault", "chatgpt", "abc-123");
    expect(result).toBe("/vault/ai-conversations/chatgpt/abc-123.md");
  });

  it("sourceを小文字に変換する", () => {
    const result = resolveFilePath("/vault", "ChatGPT", "abc-123");
    expect(result).toBe("/vault/ai-conversations/chatgpt/abc-123.md");
  });
});

describe("writeConversation", () => {
  function createTmpDir(): string {
    return mkdtempSync(join(tmpdir(), "distill-test-"));
  }

  it("ファイルを書き込む", () => {
    const tmp = createTmpDir();
    const filePath = writeConversation(tmp, "chatgpt", "conv-1", "# Hello");
    expect(readFileSync(filePath, "utf-8")).toBe("# Hello");
  });

  it("ディレクトリを自動作成する", () => {
    const tmp = createTmpDir();
    const filePath = writeConversation(tmp, "chatgpt", "conv-2", "content");
    expect(filePath).toContain("ai-conversations/chatgpt/conv-2.md");
    expect(readFileSync(filePath, "utf-8")).toBe("content");
  });

  it("同一IDで上書きする", () => {
    const tmp = createTmpDir();
    writeConversation(tmp, "chatgpt", "conv-3", "first");
    writeConversation(tmp, "chatgpt", "conv-3", "second");
    const filePath = resolveFilePath(tmp, "chatgpt", "conv-3");
    expect(readFileSync(filePath, "utf-8")).toBe("second");
  });

  it("saved_at のみ異なる場合は上書きしない", () => {
    const tmp = createTmpDir();
    const md1 = "---\nsaved_at: 2026-03-06 10:00:00\n---\n# Hello";
    const md2 = "---\nsaved_at: 2026-03-06 12:00:00\n---\n# Hello";
    const filePath = writeConversation(tmp, "chatgpt", "conv-4", md1);
    const mtimeBefore = statSync(filePath).mtimeMs;

    writeConversation(tmp, "chatgpt", "conv-4", md2);
    const mtimeAfter = statSync(filePath).mtimeMs;

    expect(readFileSync(filePath, "utf-8")).toBe(md1);
    expect(mtimeAfter).toBe(mtimeBefore);
  });

  it("内容が異なる場合は上書きする", () => {
    const tmp = createTmpDir();
    const md1 = "---\nsaved_at: 2026-03-06 10:00:00\n---\n# Hello";
    const md2 = "---\nsaved_at: 2026-03-06 12:00:00\n---\n# Hello\n\nNew message";
    writeConversation(tmp, "chatgpt", "conv-5", md1);
    writeConversation(tmp, "chatgpt", "conv-5", md2);
    const filePath = resolveFilePath(tmp, "chatgpt", "conv-5");
    expect(readFileSync(filePath, "utf-8")).toBe(md2);
  });

  it("既存ファイルの未知フロントマターフィールドを保持する", () => {
    const tmp = createTmpDir();
    const existing =
      '---\nsource: chatgpt\nurl: https://example.com\nsaved_at: 2026-03-06T10:00:00+09:00\ntitle: "Hello"\ntags: [ai, test]\nrating: 5\n---\n\n# Hello\n\n**User:**\n\nHi\n';
    const filePath = resolveFilePath(tmp, "chatgpt", "conv-extra");
    mkdirSync(dirname(filePath), { recursive: true });
    fsWriteFileSync(filePath, existing, "utf-8");

    const newMarkdown =
      '---\nsource: chatgpt\nurl: https://example.com\nsaved_at: 2026-03-06T12:00:00+09:00\ntitle: "Hello"\n---\n\n# Hello\n\n**User:**\n\nHi\n\n---\n\n**Assistant:**\n\nHello!\n';
    writeConversation(tmp, "chatgpt", "conv-extra", newMarkdown);

    const result = readFileSync(filePath, "utf-8");
    expect(result).toContain("tags: [ai, test]");
    expect(result).toContain("rating: 5");
    expect(result).toContain("**Assistant:**");
  });

  it("既存ファイルに未知フィールドがない場合はそのまま書き込む", () => {
    const tmp = createTmpDir();
    const existing =
      '---\nsource: chatgpt\nurl: https://example.com\nsaved_at: 2026-03-06T10:00:00+09:00\ntitle: "Hello"\n---\n\n# Hello\n\n**User:**\n\nHi\n';
    const filePath = resolveFilePath(tmp, "chatgpt", "conv-no-extra");
    mkdirSync(dirname(filePath), { recursive: true });
    fsWriteFileSync(filePath, existing, "utf-8");

    const newMarkdown =
      '---\nsource: chatgpt\nurl: https://example.com\nsaved_at: 2026-03-06T12:00:00+09:00\ntitle: "Hello"\n---\n\n# Hello\n\n**User:**\n\nHi\n\n---\n\n**Assistant:**\n\nHello!\n';
    writeConversation(tmp, "chatgpt", "conv-no-extra", newMarkdown);

    const result = readFileSync(filePath, "utf-8");
    expect(result).toContain("**Assistant:**");
  });
});

describe("slugifyArtifactName", () => {
  it("拡張子を保ったまま不正文字を除去する", () => {
    expect(slugifyArtifactName("My Report.html")).toBe("My-Report.html");
    expect(slugifyArtifactName("a/b\\c:d?.html")).toBe("abcd.html");
  });

  it("拡張子だけの名前は fallback 名を返す", () => {
    expect(slugifyArtifactName(".html")).toBe("artifact.html");
  });

  it("拡張子なしも扱える", () => {
    expect(slugifyArtifactName("README")).toBe("README");
  });
});

describe("resolveArtifactPath", () => {
  it("正しい保存先を返す", () => {
    const p = resolveArtifactPath("/vault", "claude", "conv-1", "Report.html");
    expect(p).toBe("/vault/ai-conversations/claude/conv-1/Report.html");
  });
});

describe("ingestArtifact", () => {
  function createTmpDir(): string {
    return mkdtempSync(join(tmpdir(), "distill-ingest-"));
  }

  it("ステージングのファイルを vault に移動する", () => {
    const tmp = createTmpDir();
    const staging = join(tmp, "staging", "Report.html");
    mkdirSync(dirname(staging), { recursive: true });
    fsWriteFileSync(staging, "<html>hi</html>", "utf-8");

    const dest = ingestArtifact(tmp, "claude", "conv-x", staging, "Report.html");
    expect(dest).toBe(join(tmp, "ai-conversations", "claude", "conv-x", "Report.html"));
    expect(readFileSync(dest, "utf-8")).toBe("<html>hi</html>");
    expect(existsSync(staging)).toBe(false);
  });

  it("同名で再取り込みすると上書きする", () => {
    const tmp = createTmpDir();
    const staging1 = join(tmp, "staging1", "x.html");
    const staging2 = join(tmp, "staging2", "x.html");
    mkdirSync(dirname(staging1), { recursive: true });
    mkdirSync(dirname(staging2), { recursive: true });
    fsWriteFileSync(staging1, "v1", "utf-8");
    fsWriteFileSync(staging2, "v2", "utf-8");

    ingestArtifact(tmp, "claude", "c", staging1, "x.html");
    const dest = ingestArtifact(tmp, "claude", "c", staging2, "x.html");
    expect(readFileSync(dest, "utf-8")).toBe("v2");
  });
});

describe("findConversationByArtifactTitle", () => {
  function createTmpDir(): string {
    return mkdtempSync(join(tmpdir(), "distill-find-"));
  }

  function makeMd(title: string, artifactTitle: string): string {
    return [
      "---",
      "source: grok",
      `title: "${title}"`,
      "artifacts:",
      `  - title: "${artifactTitle}"`,
      "    type: HTML",
      "---",
      "# x",
    ].join("\n");
  }

  it("title が完全一致する .md の conv ID を返す", () => {
    const tmp = createTmpDir();
    const dir = join(tmp, "ai-conversations", "grok");
    mkdirSync(dir, { recursive: true });
    fsWriteFileSync(join(dir, "abc-123.md"), makeMd("Convo A", "report.html"), "utf-8");
    fsWriteFileSync(join(dir, "xyz-789.md"), makeMd("Convo B", "other.html"), "utf-8");

    expect(findConversationByArtifactTitle(tmp, "grok", "report.html")).toBe("abc-123");
  });

  it("拡張子を落とした title でも一致する", () => {
    const tmp = createTmpDir();
    const dir = join(tmp, "ai-conversations", "claude");
    mkdirSync(dir, { recursive: true });
    fsWriteFileSync(
      join(dir, "conv-1.md"),
      makeMd("Convo A", "Cognitive surrender report"),
      "utf-8",
    );

    expect(findConversationByArtifactTitle(tmp, "claude", "Cognitive surrender report.html")).toBe(
      "conv-1",
    );
  });

  it("該当なしなら null", () => {
    const tmp = createTmpDir();
    const dir = join(tmp, "ai-conversations", "grok");
    mkdirSync(dir, { recursive: true });
    fsWriteFileSync(join(dir, "conv-1.md"), makeMd("Convo A", "other.html"), "utf-8");

    expect(findConversationByArtifactTitle(tmp, "grok", "missing.html")).toBeNull();
  });

  it("ディレクトリ自体がなければ null", () => {
    const tmp = createTmpDir();
    expect(findConversationByArtifactTitle(tmp, "grok", "anything.html")).toBeNull();
  });
});

describe("stripSavedAt", () => {
  it("saved_at 行を除去する", () => {
    const md = "---\nsaved_at: 2026-03-06 10:00:00\ntitle: Test\n---";
    expect(stripSavedAt(md)).toBe("---\n\ntitle: Test\n---");
  });

  it("saved_at がない場合はそのまま返す", () => {
    const md = "---\ntitle: Test\n---";
    expect(stripSavedAt(md)).toBe(md);
  });
});
