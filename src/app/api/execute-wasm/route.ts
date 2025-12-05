export const maxDuration = 30;

function isWatFormat(code: string): boolean {
  return code.trim().startsWith("(module");
}

export async function POST(req: Request) {
  try {
    const { code, wasmBytes, functionName = "main", args = [] } = await req.json();

    if (!code && !wasmBytes) {
      return new Response(
        JSON.stringify({ error: "No WASM code or bytes provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let wasmModule: WebAssembly.Module;
    let output = "";

    if (wasmBytes) {
      const bytes = Uint8Array.from(atob(wasmBytes), c => c.charCodeAt(0));
      wasmModule = await WebAssembly.compile(bytes);
    } else if (isWatFormat(code)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "WAT format detected. Please compile to WASM binary first.",
          output: null,
          language: "wasm",
          hint: "Use 'wat2wasm' from WABT to compile WAT to WASM.",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "For JavaScript + WASM, use the JavaScript executor.",
          output: null,
          language: "wasm",
          hint: "Use /api/execute-js for JavaScript code with WebAssembly.",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const instance = await WebAssembly.instantiate(wasmModule, {
      env: {
        print: (value: number) => {
          output += value.toString() + "\n";
        },
        print_str: (ptr: number, len: number) => {
          output += `[String at ${ptr}, length ${len}]\n`;
        },
      },
      wasi_snapshot_preview1: {
        fd_write: () => 0,
        fd_close: () => 0,
        fd_seek: () => 0,
        proc_exit: () => {},
      },
    });

    const exports = instance.exports as Record<string, unknown>;

    if (typeof exports[functionName] === "function") {
      const fn = exports[functionName] as (...args: number[]) => number;
      const result = fn(...args.map(Number));
      output += `${functionName}(${args.join(", ")}) = ${result}`;
    } else if (typeof exports._start === "function") {
      const start = exports._start as () => void;
      start();
      output += "WASM module executed (_start)";
    } else if (typeof exports.main === "function") {
      const main = exports.main as () => number;
      const result = main();
      output += `main() = ${result}`;
    } else {
      const availableExports = Object.keys(exports).filter(
        k => typeof exports[k] === "function"
      );
      output = `Available exports: ${availableExports.join(", ") || "none"}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        output: output || "WASM executed successfully (no output)",
        error: null,
        language: "wasm",
        runtime: "WebAssembly (Native)",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("WASM execution error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "WASM execution failed",
        output: null,
        language: "wasm",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
