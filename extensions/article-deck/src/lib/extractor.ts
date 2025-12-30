import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import type { ExtractedContent } from "../types/index.ts";

export function extractContent(doc: Document): ExtractedContent {
  const clonedDoc = doc.cloneNode(true) as Document;
  const reader = new Readability(clonedDoc);
  const article = reader.parse();

  if (!article) {
    throw new Error("Failed to parse article content");
  }

  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });
  turndownService.use(gfm);

  const markdown = turndownService.turndown(article.content);

  return {
    title: article.title,
    content: article.content,
    markdown,
    url: doc.location.href,
  };
}
