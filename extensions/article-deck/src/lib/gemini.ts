import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ExtractedContent } from "../types/index.ts";

const SYSTEM_PROMPT = `You are an expert at creating presentations.
Convert the following article content into Marp format slides.

## Requirements
- Include \`marp: true\` in the frontmatter
- Keep each slide concise (use bullet points)
- Use \`---\` as slide separator
- Create appropriate section divisions
- Extract key points
- Use proper headings for each slide
- Target 5-10 slides depending on content length

## Output Format
Return ONLY the Marp markdown content, no explanations.
Start with the frontmatter block.`;

export async function generateSlides(apiKey: string, content: ExtractedContent): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `${SYSTEM_PROMPT}

## Article Title
${content.title}

## Article URL
${content.url}

## Article Content
${content.markdown}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

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
}
