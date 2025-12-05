/**
 * JavaScript Executor - Separated from FaaS provider for testability
 */

export interface ExecutionResult {
  success: boolean;
  output: string | null;
  error: string | null;
  runtime: string;
  executionTime?: number;
}

export interface IJavaScriptEngine {
  execute(code: string): Promise<ExecutionResult>;
  dispose(): void;
}

export class JavaScriptExecutor {
  private engine: IJavaScriptEngine | null = null;

  constructor(private engineFactory: () => Promise<IJavaScriptEngine>) {}

  async execute(code: string): Promise<ExecutionResult> {
    if (!code || !code.trim()) {
      return {
        success: false,
        output: null,
        error: "No code provided",
        runtime: "QuickJS (Sandboxed)",
      };
    }

    const startTime = Date.now();

    try {
      this.engine = await this.engineFactory();
      const result = await this.engine.execute(code);

      return {
        ...result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : "Execution failed",
        runtime: "QuickJS (Sandboxed)",
        executionTime: Date.now() - startTime,
      };
    } finally {
      if (this.engine) {
        this.engine.dispose();
        this.engine = null;
      }
    }
  }
}

export class QuickJSEngine implements IJavaScriptEngine {
  private vm: any;
  private QuickJS: any;

  constructor(quickJS: any) {
    this.QuickJS = quickJS;
    this.vm = quickJS.newContext();
  }

  async execute(code: string): Promise<ExecutionResult> {
    const logs: string[] = [];
    const errors: string[] = [];

    const consoleLog = this.vm.newFunction("log", (...args: any[]) => {
      const output = args.map((arg: any) => this.vm.getString(arg)).join(" ");
      logs.push(output);
    });

    const consoleError = this.vm.newFunction("error", (...args: any[]) => {
      const output = args.map((arg: any) => this.vm.getString(arg)).join(" ");
      errors.push(output);
    });

    const consoleObj = this.vm.newObject();
    this.vm.setProp(consoleObj, "log", consoleLog);
    this.vm.setProp(consoleObj, "error", consoleError);
    this.vm.setProp(this.vm.global, "console", consoleObj);

    consoleLog.dispose();
    consoleError.dispose();
    consoleObj.dispose();

    const result = this.vm.evalCode(code, "user-code.js", { strict: true });

    let output = "";
    let success = true;
    let errorMessage = "";

    if (result.error) {
      success = false;
      const errorObj = this.vm.dump(result.error);
      errorMessage = errorObj?.message || errorObj?.toString() || "Unknown error";
      result.error.dispose();
    } else {
      const value = this.vm.dump(result.value);
      result.value.dispose();

      if (logs.length > 0) {
        output = logs.join("\n");
      }

      if (value !== undefined && value !== null) {
        const valueStr = typeof value === "object"
          ? JSON.stringify(value, null, 2)
          : String(value);
        output = output ? `${output}\n\u2192 ${valueStr}` : `\u2192 ${valueStr}`;
      }
    }

    if (errors.length > 0) {
      errorMessage = errors.join("\n") + (errorMessage ? "\n" + errorMessage : "");
    }

    return {
      success,
      output: output || (success ? "Code executed successfully (no output)" : null),
      error: errorMessage || null,
      runtime: "QuickJS (Sandboxed)",
    };
  }

  dispose(): void {
    if (this.vm) {
      this.vm.dispose();
      this.vm = null;
    }
  }
}

export class MockJavaScriptEngine implements IJavaScriptEngine {
  private mockResult: ExecutionResult;

  constructor(mockResult?: Partial<ExecutionResult>) {
    this.mockResult = {
      success: true,
      output: "Mock output",
      error: null,
      runtime: "Mock Engine",
      ...mockResult,
    };
  }

  async execute(_code: string): Promise<ExecutionResult> {
    return this.mockResult;
  }

  dispose(): void {}
}

export async function createQuickJSEngine(): Promise<IJavaScriptEngine> {
  const { getQuickJS } = await import("quickjs-emscripten");
  const QuickJS = await getQuickJS();
  return new QuickJSEngine(QuickJS);
}
