/** 会話データ */
export interface ConversationData {
  source: "chatgpt" | "grok" | "claude";
  conversationId: string;
  url: string;
  title: string;
  messages: ConversationMessage[];
  artifacts?: ArtifactMeta[];
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/** アーティファクトのメタ情報（存在記録のみ、本体はダウンロードフック経由で別保存） */
export interface ArtifactMeta {
  /** 安定識別子。Claude MCP の toolu_XXX 等。取れないサイトでは省略 */
  id?: string;
  /** 人間可読タイトル */
  title: string;
  /** 種別ラベル（"HTML" / "mcp-widget" 等） */
  type: string;
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

/** ダウンロードフックでサーバに送る payload */
export interface IngestArtifactRequest {
  /** Chrome が保存した一時パス（Downloads 配下の絶対パス） */
  srcPath: string;
  source: "chatgpt" | "grok" | "claude";
  /** conv ID が DL 時に確定しない場合は省略。サーバが title から逆引きする */
  conversationId?: string;
  /** 元ファイル名（拡張子付き） */
  originalName: string;
  mime?: string;
}

export interface IngestArtifactResponse {
  success: boolean;
  filePath?: string;
  error?: string;
}
