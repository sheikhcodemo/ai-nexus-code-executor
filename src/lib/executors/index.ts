/**
 * Code Executors - Testable, provider-independent implementations
 *
 * Following serverless best practices:
 * - Business logic separated from FaaS provider
 * - Dependency injection for testability
 * - Mock implementations for unit testing
 */

export {
  JavaScriptExecutor,
  QuickJSEngine,
  MockJavaScriptEngine,
  createQuickJSEngine,
  type IJavaScriptEngine,
  type ExecutionResult as JSExecutionResult,
} from "./javascript-executor";

export {
  PythonExecutor,
  E2BSandboxFactory,
  MockPythonSandbox,
  MockSandboxFactory,
  type IPythonSandbox,
  type ISandboxFactory,
  type ExecutionResult as PyExecutionResult,
} from "./python-executor";

export interface CodeExecutionRequest {
  code: string;
  language: string;
}

export interface CodeExecutionResponse {
  success: boolean;
  output: string | null;
  error: string | null;
  runtime: string;
  language: string;
  executionTime?: number;
  hint?: string;
}
