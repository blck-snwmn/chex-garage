import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import { parseArticle, htmlToMarkdown, extractContent } from "./extractor";

describe("parseArticle", () => {
  it("should extract title and content from article HTML", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Test Article</title></head>
        <body>
          <article>
            <h1>Test Article Title</h1>
            <p>This is the first paragraph of the article.</p>
            <p>This is the second paragraph with more content.</p>
          </article>
        </body>
      </html>
    `;

    const dom = new JSDOM(html, { url: "https://example.com/article" });
    const result = parseArticle(dom.window.document);

    // Readability uses <title> tag for title, not <h1>
    expect(result.title).toBe("Test Article");
    expect(result.content).toContain("first paragraph");
    expect(result.content).toContain("second paragraph");
  });

  it("should throw error when no article content found", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Empty Page</title></head>
        <body></body>
      </html>
    `;

    const dom = new JSDOM(html, { url: "https://example.com" });

    expect(() => parseArticle(dom.window.document)).toThrow("Failed to parse article content");
  });

  it("should handle complex article with multiple sections", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Complex Article</title></head>
        <body>
          <main>
            <article>
              <header>
                <h1>Understanding JavaScript Testing</h1>
                <p class="meta">Published on 2025-01-01</p>
              </header>
              <section>
                <h2>Introduction</h2>
                <p>Testing is crucial for software quality.</p>
              </section>
              <section>
                <h2>Types of Tests</h2>
                <ul>
                  <li>Unit tests</li>
                  <li>Integration tests</li>
                  <li>E2E tests</li>
                </ul>
              </section>
            </article>
          </main>
          <aside>
            <p>This sidebar content should be ignored.</p>
          </aside>
        </body>
      </html>
    `;

    const dom = new JSDOM(html, { url: "https://example.com/js-testing" });
    const result = parseArticle(dom.window.document);

    // Readability uses <title> tag for title
    expect(result.title).toBe("Complex Article");
    expect(result.content).toContain("Introduction");
    expect(result.content).toContain("Unit tests");
  });
});

describe("htmlToMarkdown", () => {
  it("should convert simple HTML to markdown", () => {
    const html = "<p>Hello <strong>world</strong>!</p>";
    const result = htmlToMarkdown(html);

    expect(result).toBe("Hello **world**!");
  });

  it("should convert headings", () => {
    const html = "<h1>Title</h1><h2>Subtitle</h2><p>Content</p>";
    const result = htmlToMarkdown(html);

    expect(result).toContain("# Title");
    expect(result).toContain("## Subtitle");
  });

  it("should convert lists", () => {
    const html = `
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
    `;
    const result = htmlToMarkdown(html);

    // Turndown uses * for list items by default
    expect(result).toContain("Item 1");
    expect(result).toContain("Item 2");
    expect(result).toContain("Item 3");
    // Verify it's a list (contains list marker)
    expect(result).toMatch(/[*-]\s+Item 1/);
  });

  it("should convert links", () => {
    const html = '<a href="https://example.com">Example Link</a>';
    const result = htmlToMarkdown(html);

    expect(result).toBe("[Example Link](https://example.com)");
  });

  it("should convert code blocks (GFM)", () => {
    const html = "<pre><code>const x = 1;</code></pre>";
    const result = htmlToMarkdown(html);

    expect(result).toContain("```");
    expect(result).toContain("const x = 1;");
  });

  it("should convert tables (GFM)", () => {
    const html = `
      <table>
        <thead>
          <tr><th>Name</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr><td>A</td><td>1</td></tr>
          <tr><td>B</td><td>2</td></tr>
        </tbody>
      </table>
    `;
    const result = htmlToMarkdown(html);

    expect(result).toContain("| Name | Value |");
    expect(result).toContain("| A | 1 |");
  });
});

describe("extractContent", () => {
  it("should extract content and convert to markdown with URL", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>My Article</title></head>
        <body>
          <article>
            <h1>My Article Heading</h1>
            <p>This is <strong>important</strong> content.</p>
          </article>
        </body>
      </html>
    `;

    const dom = new JSDOM(html, { url: "https://example.com/my-article" });
    const result = extractContent(dom.window.document, "https://example.com/my-article");

    // Readability uses <title> tag for title
    expect(result.title).toBe("My Article");
    expect(result.markdown).toContain("**important**");
    expect(result.url).toBe("https://example.com/my-article");
  });
});
