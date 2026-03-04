export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationData {
  source: "chatgpt" | "grok";
  conversationId: string;
  url: string;
  title: string;
  model: string;
  messages: ConversationMessage[];
}

/** サーバーへの保存リクエスト */
export interface SaveRequest {
  data: ConversationData;
}

/** サーバーからの保存レスポンス */
export interface SaveResponse {
  success: boolean;
  filePath?: string;
  error?: string;
}
