import { getQuickJS } from "quickjs-emscripten";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "No code provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const QuickJS = await getQuickJS();
    const vm = QuickJS.newContext();

    const logs: string[] = [];
    const errors: string[] = [];

    const consoleLog = vm.newFunction("log", (...args) => {
      const output = args.map(arg => {
        const str = vm.getString(arg);
        return str;
      }).join(" ");
      logs.push(output);
    });

    const consoleError = vm.newFunction("error", (...args) => {
      const output = args.map(arg => {
        const str = vm.getString(arg);
        return str;
      }).join(" ");
      errors.push(output);
    });

    const consoleObj = vm.newObject();
    vm.setProp(consoleObj, "log", consoleLog);
    vm.setProp(consoleObj, "error", consoleError);
    vm.setProp(vm.global, "console", consoleObj);

    consoleLog.dispose();
    consoleError.dispose();
    consoleObj.dispose();

    const result = vm.evalCode(code, "user-code.js", {
      strict: true,
    });

    let output = "";
    let success = true;
    let errorMessage = "";

    if (result.error) {
      success = false;
      const errorObj = vm.dump(result.error);
      errorMessage = errorObj?.message || errorObj?.toString() || "Unknown error";
      result.error.dispose();
    } else {
      const value = vm.dump(result.value);
      result.value.dispose();

      if (logs.length > 0) {
        output = logs.join("\n");
      }

      if (value !== undefined && value !== null) {
        const valueStr = typeof value === "object"
          ? JSON.stringify(value, null, 2)
          : String(value);
        if (output) {
          output += "\n\u2192 " + valueStr;
        } else {
          output = "\u2192 " + valueStr;
        }
      }
    }

    if (errors.length > 0) {
      errorMessage = errors.join("\n") + (errorMessage ? "\n" + errorMessage : "");
    }

    vm.dispose();

    return new Response(
      JSON.stringify({
        success,
        output: output || (success ? "Code executed successfully (no output)" : null),
        error: errorMessage || null,
        language: "javascript",
        runtime: "QuickJS (Sandboxed)",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("JavaScript execution error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Execution failed",
        output: null,
        language: "javascript",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
