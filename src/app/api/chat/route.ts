import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

export const maxDuration = 60;

function getModel() {
  if (process.env.OPENAI_API_KEY) {
    return openai("gpt-4o");
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic("claude-3-5-sonnet-latest");
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return google("gemini-1.5-pro");
  }
  return openai("gpt-4o-mini");
}

const systemPrompt = `You are an expert coding assistant. You help users write, understand, and debug code.

When writing code, always:
1. Use proper code blocks with language identifiers (e.g., \`\`\`javascript, \`\`\`python, \`\`\`typescript)
2. Write clean, well-commented code
3. Explain what the code does

The user can execute code directly in the chat. Supported languages:
- JavaScript (QuickJS sandboxed runtime)
- TypeScript (transpiled to JavaScript)
- Python (E2B cloud sandbox)
- WebAssembly (WASM binary execution)

When asked to write executable code, prefer JavaScript or Python as they can be run directly.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Chat failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
