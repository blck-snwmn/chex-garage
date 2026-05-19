export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ArtifactMeta {
  id?: string;
  title: string;
  type: string;
}

export interface ConversationData {
  source: "chatgpt" | "grok" | "claude";
  conversationId: string;
  url: string;
  title: string;
  messages: ConversationMessage[];
  artifacts?: ArtifactMeta[];
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

/** アーティファクト取り込みリクエスト。conversationId が未指定なら vault の frontmatter から逆引き */
export interface IngestArtifactRequest {
  srcPath: string;
  source: "chatgpt" | "grok" | "claude";
  conversationId?: string;
  originalName: string;
  mime?: string;
}

export interface IngestArtifactResponse {
  success: boolean;
  filePath?: string;
  error?: string;
}
