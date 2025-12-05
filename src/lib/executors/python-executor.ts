/**
 * Python Executor - Separated from FaaS provider for testability
 */

export interface ExecutionResult {
  success: boolean;
  output: string | null;
  error: string | null;
  runtime: string;
  results?: unknown[];
}

export interface IPythonSandbox {
  runCode(code: string): Promise<{
    logs: { stdout: string[]; stderr: string[] };
    error?: { name: string } | null;
    results?: unknown[];
  }>;
  kill(): Promise<void>;
}

export interface ISandboxFactory {
  create(): Promise<IPythonSandbox>;
}

export class PythonExecutor {
  constructor(
    private sandboxFactory: ISandboxFactory | null,
    private isEnabled: boolean = true
  ) {}

  async execute(code: string): Promise<ExecutionResult> {
    if (!code || !code.trim()) {
      return {
        success: false,
        output: null,
        error: "No code provided",
        runtime: "E2B (Cloud Sandbox)",
      };
    }

    if (!this.isEnabled || !this.sandboxFactory) {
      return {
        success: true,
        output: `[Demo Mode] Code execution is simulated.\n\nCode:\n${code}`,
        error: null,
        runtime: "Demo Mode",
      };
    }

    let sandbox: IPythonSandbox | null = null;

    try {
      sandbox = await this.sandboxFactory.create();
      const execution = await sandbox.runCode(code);

      return {
        success: !execution.error,
        output: execution.logs.stdout.join("\n") || "Code executed successfully (no output)",
        error: execution.error?.name || execution.logs.stderr.join("\n") || null,
        runtime: "E2B (Cloud Sandbox)",
        results: execution.results,
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : "Execution failed",
        runtime: "E2B (Cloud Sandbox)",
      };
    } finally {
      if (sandbox) {
        await sandbox.kill();
      }
    }
  }
}

export class E2BSandboxFactory implements ISandboxFactory {
  async create(): Promise<IPythonSandbox> {
    const Sandbox = (await import("@e2b/code-interpreter")).default;
    return await Sandbox.create();
  }
}

export class MockPythonSandbox implements IPythonSandbox {
  private mockOutput: string;
  private mockError: { name: string } | null;

  constructor(output: string = "Hello, World!", error: { name: string } | null = null) {
    this.mockOutput = output;
    this.mockError = error;
  }

  async runCode(_code: string) {
    return {
      logs: {
        stdout: [this.mockOutput],
        stderr: [],
      },
      error: this.mockError,
      results: [],
    };
  }

  async kill(): Promise<void> {}
}

export class MockSandboxFactory implements ISandboxFactory {
  constructor(private sandbox: IPythonSandbox) {}

  async create(): Promise<IPythonSandbox> {
    return this.sandbox;
  }
}
