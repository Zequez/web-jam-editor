export * from "./process-file";
import type { CompileResult } from "./process-code";
type CompileError = Extract<CompileResult, { type: "code-error" }>;

export type { CompileResult, CompileError };
