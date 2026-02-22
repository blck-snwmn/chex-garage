import type { ExtractedContent } from "./types.ts";

const SLIDE_SYSTEM_PROMPT = `You are an expert at creating presentations.
Convert the following summarized content into Marp format slides.

## Requirements
- Include \`marp: true\` in the frontmatter
- Keep each slide concise (use bullet points)
- Use \`---\` as slide separator
- Create appropriate section divisions
- Use proper headings for each slide
- Target 5-10 slides depending on content length
- Write all slide content in Japanese

## Output Format
Return ONLY the Marp markdown content, no explanations.
Start with the frontmatter block.`;

export interface NanoAvailability {
  summarizer: boolean;
  prompt: boolean;
}

export async function checkAvailability(): Promise<NanoAvailability> {
  const summarizerAvail =
    "Summarizer" in self ? (await Summarizer.availability()) !== "unavailable" : false;
  const promptAvail =
    "LanguageModel" in self ? (await LanguageModel.availability()) !== "unavailable" : false;
  return { summarizer: summarizerAvail, prompt: promptAvail };
}

async function summarizeContent(markdown: string): Promise<string> {
  const summarizer = await Summarizer.create({
    type: "key-points",
    format: "markdown",
    length: "long",
    sharedContext:
      "This is a web article to be converted into presentation slides. Extract the most important points.",
    outputLanguage: "ja",
  });

  try {
    return await summarizer.summarize(markdown);
  } finally {
    summarizer.destroy();
  }
}

async function generateSlidesFromSummary(
  summary: string,
  title: string,
  url: string,
): Promise<string> {
  const session = await LanguageModel.create({
    initialPrompts: [{ role: "system", content: SLIDE_SYSTEM_PROMPT }],
  });

  try {
    const prompt = `## Article Title
${title}

## Article URL
${url}

## Summarized Content
${summary}`;

    const text = await session.prompt(prompt);

    // Clean up the response (remove markdown code blocks if present)
    let cleaned = text.trim();
    if (cleaned.startsWith("```markdown")) {
      cleaned = cleaned.slice(11);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }

    return cleaned.trim();
  } finally {
    session.destroy();
  }
}

export async function generateSlides(content: ExtractedContent): Promise<string> {
  const summary = await summarizeContent(content.markdown);
  return generateSlidesFromSummary(summary, content.title, content.url);
}
