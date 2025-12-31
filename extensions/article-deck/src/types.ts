export interface ExtractedContent {
  title: string;
  content: string;
  markdown: string;
  url: string;
}

export interface SlideResult {
  markdown: string;
  html: string;
}

export interface GenerateSlideRequest {
  type: "GENERATE_SLIDE";
  content: ExtractedContent;
}

export interface GenerateSlideResponse {
  success: boolean;
  result?: SlideResult;
  error?: string;
}

export interface ExtractContentRequest {
  type: "EXTRACT_CONTENT";
}

export interface ExtractContentResponse {
  success: boolean;
  content?: ExtractedContent;
  error?: string;
}

export type MessageRequest = GenerateSlideRequest | ExtractContentRequest;
export type MessageResponse = GenerateSlideResponse | ExtractContentResponse;

export interface StorageData {
  apiKey?: string;
}
