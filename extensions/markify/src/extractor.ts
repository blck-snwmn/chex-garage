import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import type { ExtractResult } from "./types";

export function parseArticle(doc: Document): { title: string; content: string } | null {
  const serializer = new XMLSerializer();
  const html = serializer.serializeToString(doc);
  const parser = new DOMParser();
  const clonedDoc = parser.parseFromString(html, "text/html");
  const reader = new Readability(clonedDoc);
  const article = reader.parse();

  if (!article?.content) {
    return null;
  }

  return {
    title: article.title || doc.title || "Untitled",
    content: article.content,
  };
}

export function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  turndown.use(gfm);

  return turndown.turndown(html);
}

export function extractContent(doc: Document, url?: string): ExtractResult {
  const article = parseArticle(doc);

  if (!article) {
    return {
      success: false,
      error: "Could not extract content from this page",
    };
  }

  const markdown = htmlToMarkdown(article.content);
  const pageUrl = url || doc.URL || "";

  const fullMarkdown = `# ${article.title}\n\n> Source: ${pageUrl}\n\n${markdown}`;

  return {
    success: true,
    content: {
      title: article.title,
      markdown: fullMarkdown,
      url: pageUrl,
    },
  };
}
