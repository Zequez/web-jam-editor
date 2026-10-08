import unoConfig from "./uno-browser-config.ts";
import { createGenerator } from "@unocss/core";
const uno = await createGenerator(unoConfig);

export async function extract(html: string): Promise<[Set<string>, string]> {
  const tokens = new Set<string>();

  const result = await uno.applyExtractors(html);
  for (const token of result) {
    tokens.add(token);
  }

  tokens.add(`[text-6/30=""]`);

  const { css } = await uno.generate([...tokens], {
    preflights: true,
    minify: false,
  });

  return [tokens, css];
}
