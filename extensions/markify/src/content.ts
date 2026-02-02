import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

interface ExtractResult {
  success: boolean;
  title?: string;
  markdown?: string;
  error?: string;
}

function parseArticle(doc: Document): { title: string; content: string } | null {
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

function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  turndown.use(gfm);

  return turndown.turndown(html);
}

function extractContent(): ExtractResult {
  const article = parseArticle(document);

  if (!article) {
    return { success: false, error: "Could not extract content from this page" };
  }

  const markdown = htmlToMarkdown(article.content);
  const url = document.location.href;
  const fullMarkdown = `# ${article.title}\n\n> Source: ${url}\n\n${markdown}`;

  return {
    success: true,
    title: article.title,
    markdown: fullMarkdown,
  };
}

extractContent();
