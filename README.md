# AI Nexus

A Next.js application with multi-language code execution powered by AI.

## Features

- **Multi-Provider AI Chat**: Supports OpenAI, Anthropic, and Google AI models
- **JavaScript Execution**: Sandboxed execution using QuickJS (via quickjs-emscripten)
- **Python Execution**: Cloud sandbox execution using E2B Code Interpreter
- **WebAssembly Support**: Native WASM binary execution
- **Testable Architecture**: Provider-independent executor classes with dependency injection

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI SDK**: Vercel AI SDK v4
- **Code Execution**:
  - JavaScript: QuickJS-Emscripten (sandboxed)
  - Python: E2B Code Interpreter (cloud)
  - WebAssembly: Native Node.js support

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Add your API keys and run:
   ```bash
   npm run dev
   ```

## License

MIT
