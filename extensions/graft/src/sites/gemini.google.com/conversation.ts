/**
 * Extract conversation ID from jslog attribute value
 *
 * jslog format: "...;BardVeMetadataKey:[...,[&quot;c_637dd0c444724b12&quot;,null,0]];..."
 * ID format: c_ + 16 hex characters
 *
 * @param jslog - jslog attribute value
 * @returns Conversation ID (16 hex chars) or null if not found
 */
export function extractConversationId(jslog: string | null): string | null {
	if (!jslog) return null;

	const match = jslog.match(/c_([a-f0-9]{16})/);
	return match?.[1] ?? null;
}

/**
 * Build Gemini conversation URL from conversation ID
 *
 * @param conversationId - 16 hex character conversation ID
 * @returns Full URL to the conversation
 */
export function buildConversationUrl(conversationId: string): string {
	return `https://gemini.google.com/app/${conversationId}`;
}
