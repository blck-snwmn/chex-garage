const DEFAULT_TITLE = "Gemini";

/**
 * Format browser tab title for Gemini conversation
 *
 * @param chatTitle - Current conversation title (optional)
 * @returns Formatted tab title
 */
export function formatTabTitle(chatTitle?: string | null): string {
	const trimmed = chatTitle?.trim();
	if (trimmed) {
		return `${trimmed} - ${DEFAULT_TITLE}`;
	}
	return DEFAULT_TITLE;
}
