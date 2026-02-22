// Chrome Built-in AI API type declarations
// Summarizer API (Chrome 138+)
// Prompt API / LanguageModel (Chrome 138+)

type AIAvailability = "unavailable" | "downloadable" | "available";

interface SummarizerCreateOptions {
  type?: "key-points" | "tldr" | "teaser" | "headline";
  format?: "markdown" | "plain-text";
  length?: "short" | "medium" | "long";
  sharedContext?: string;
  expectedInputLanguages?: string[];
  outputLanguage?: string;
  monitor?: (monitor: SummarizerDownloadMonitor) => void;
}

interface SummarizerDownloadMonitor extends EventTarget {
  addEventListener(type: "downloadprogress", listener: (event: { loaded: number }) => void): void;
}

interface SummarizerInstance {
  summarize(text: string, options?: { context?: string }): Promise<string>;
  summarizeStreaming(text: string, options?: { context?: string }): ReadableStream<string>;
  destroy(): void;
}

interface SummarizerConstructor {
  availability(options?: SummarizerCreateOptions): Promise<AIAvailability>;
  create(options?: SummarizerCreateOptions): Promise<SummarizerInstance>;
}

declare const Summarizer: SummarizerConstructor;

interface LanguageModelPrompt {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LanguageModelCreateOptions {
  initialPrompts?: LanguageModelPrompt[];
  topK?: number;
  temperature?: number;
  signal?: AbortSignal;
  monitor?: (monitor: SummarizerDownloadMonitor) => void;
}

interface LanguageModelSession {
  prompt(text: string, options?: { signal?: AbortSignal }): Promise<string>;
  promptStreaming(text: string, options?: { signal?: AbortSignal }): ReadableStream<string>;
  inputUsage: number;
  inputQuota: number;
  clone(): Promise<LanguageModelSession>;
  destroy(): void;
}

interface LanguageModelAvailabilityOptions {
  expectedInputs?: Array<{ type: string; languages?: string[] }>;
  expectedOutputs?: Array<{ type: string; languages?: string[] }>;
}

interface LanguageModelConstructor {
  availability(options?: LanguageModelAvailabilityOptions): Promise<AIAvailability>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
  params(): Promise<{
    defaultTopK: number;
    maxTopK: number;
    defaultTemperature: number;
    maxTemperature: number;
  }>;
}

declare const LanguageModel: LanguageModelConstructor;
