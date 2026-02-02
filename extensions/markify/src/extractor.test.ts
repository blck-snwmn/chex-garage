import { describe, expect, it } from "vitest";
import { extractContent, htmlToMarkdown, parseArticle } from "./extractor";

describe("htmlToMarkdown", () => {
  it("converts basic HTML to markdown", () => {
    const html = "<p>Hello <strong>world</strong></p>";
    const result = htmlToMarkdown(html);
    expect(result).toBe("Hello **world**");
  });

  it("converts headings", () => {
    const html = "<h1>Title</h1><h2>Subtitle</h2>";
    const result = htmlToMarkdown(html);
    expect(result).toContain("# Title");
    expect(result).toContain("## Subtitle");
  });

  it("converts lists", () => {
    const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
    const result = htmlToMarkdown(html);
    expect(result).toContain("-   Item 1");
    expect(result).toContain("-   Item 2");
  });

  it("converts links", () => {
    const html = '<a href="https://example.com">Link</a>';
    const result = htmlToMarkdown(html);
    expect(result).toBe("[Link](https://example.com)");
  });

  it("converts code blocks", () => {
    const html = "<pre><code>const x = 1;</code></pre>";
    const result = htmlToMarkdown(html);
    expect(result).toContain("```");
    expect(result).toContain("const x = 1;");
  });

  it("converts tables (GFM)", () => {
    const html = `
      <table>
        <thead><tr><th>A</th><th>B</th></tr></thead>
        <tbody><tr><td>1</td><td>2</td></tr></tbody>
      </table>
    `;
    const result = htmlToMarkdown(html);
    expect(result).toContain("| A | B |");
    expect(result).toContain("| 1 | 2 |");
  });
});

describe("parseArticle", () => {
  it("extracts article content from a document", () => {
    const doc = new DOMParser().parseFromString(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Test Article</title></head>
        <body>
          <article>
            <h1>Main Title</h1>
            <p>This is a paragraph with some content that should be extracted by readability. It needs to be long enough to be considered real content.</p>
            <p>Another paragraph with more content to make sure the article has enough text for extraction to work properly.</p>
            <p>Even more content here to ensure the extraction algorithm considers this valid content.</p>
          </article>
        </body>
      </html>
    `,
      "text/html",
    );

    const result = parseArticle(doc);
    expect(result).not.toBeNull();
    expect(result?.content).toContain("paragraph");
  });

  it("returns null for pages without extractable content", () => {
    const doc = new DOMParser().parseFromString(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Empty</title></head>
        <body></body>
      </html>
    `,
      "text/html",
    );

    const result = parseArticle(doc);
    expect(result).toBeNull();
  });
});

describe("extractContent", () => {
  it("returns success with extracted markdown", () => {
    const doc = new DOMParser().parseFromString(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Test Page</title></head>
        <body>
          <article>
            <h1>Article Title</h1>
            <p>This is a test article with enough content to be extracted properly by the readability algorithm.</p>
            <p>We need multiple paragraphs to ensure the content is considered substantial enough.</p>
            <p>This third paragraph should help meet the minimum content requirements.</p>
          </article>
        </body>
      </html>
    `,
      "text/html",
    );

    const result = extractContent(doc, "https://example.com/test");
    expect(result.success).toBe(true);
    expect(result.content?.markdown).toContain("# ");
    expect(result.content?.markdown).toContain("> Source: https://example.com/test");
    expect(result.content?.url).toBe("https://example.com/test");
  });

  it("returns error for non-extractable pages", () => {
    const doc = new DOMParser().parseFromString(
      `
      <!DOCTYPE html>
      <html>
        <head><title>Empty</title></head>
        <body></body>
      </html>
    `,
      "text/html",
    );

    const result = extractContent(doc);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
