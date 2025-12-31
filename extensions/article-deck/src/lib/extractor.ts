import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import type { ExtractedContent } from "../types/index.ts";

export interface ParsedArticle {
  title: string;
  content: string;
}

/**
 * Parse HTML document using Readability to extract main article content
 */
export function parseArticle(doc: Document): ParsedArticle {
  const clonedDoc = doc.cloneNode(true) as Document;
  const reader = new Readability(clonedDoc);
  const article = reader.parse();

  if (!article) {
    throw new Error("Failed to parse article content");
  }

  return {
    title: article.title,
    content: article.content,
  };
}

/**
 * Convert HTML string to Markdown using Turndown
 */
export function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });
  turndownService.use(gfm);

  return turndownService.turndown(html);
}

/**
 * Extract content from document and convert to markdown
 */
export function extractContent(doc: Document, url?: string): ExtractedContent {
  const article = parseArticle(doc);
  const markdown = htmlToMarkdown(article.content);

  return {
    title: article.title,
    content: article.content,
    markdown,
    url: url ?? doc.location?.href ?? "",
  };
}
