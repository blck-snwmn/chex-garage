export interface ExtractedContent {
  title: string;
  markdown: string;
  url: string;
}

export interface ExtractResult {
  success: boolean;
  content?: ExtractedContent;
  error?: string;
}
