/** 会話データ */
export interface ConversationData {
  source: "chatgpt" | "grok";
  conversationId: string;
  url: string;
  title: string;
  messages: ConversationMessage[];
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/** Background → Content Script メッセージ */
export type BackgroundToContent = { type: "EXTRACT_AND_SAVE" };

/** サーバーAPI型 */
export interface SaveRequest {
  data: ConversationData;
}

export interface SaveResponse {
  success: boolean;
  filePath?: string;
  error?: string;
}
