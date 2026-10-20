export * from "./browser-compiler";
import type { CompileResult } from "./compiler";
type CompileError = Extract<CompileResult, { type: "pug-error" }>;

export type { CompileResult, CompileError };
