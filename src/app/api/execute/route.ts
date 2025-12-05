export const maxDuration = 60;

const E2B_API_KEY = process.env.E2B_API_KEY;

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "No code provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!E2B_API_KEY) {
      return new Response(
        JSON.stringify({
          success: true,
          output: `[Demo Mode] Python code execution is simulated.\n\nCode:\n${code}\n\nNote: Set E2B_API_KEY environment variable to enable real code execution.`,
          error: null,
          language: "python",
          runtime: "Demo Mode",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const Sandbox = (await import("@e2b/code-interpreter")).default;

    let sandbox;
    try {
      sandbox = await Sandbox.create();
      const execution = await sandbox.runCode(code);

      const output = execution.logs.stdout.join("\n");
      const errors = execution.logs.stderr.join("\n");

      return new Response(
        JSON.stringify({
          success: !execution.error,
          output: output || "Code executed successfully (no output)",
          error: execution.error?.name || errors || null,
          language: "python",
          runtime: "E2B (Cloud Sandbox)",
          results: execution.results,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } finally {
      if (sandbox) {
        await sandbox.kill();
      }
    }
  } catch (error) {
    console.error("Python execution error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Execution failed",
        output: null,
        language: "python",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
