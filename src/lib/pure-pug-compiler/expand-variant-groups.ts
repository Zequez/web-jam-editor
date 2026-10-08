export function expandVariantGroups(input: string): string {
  let output = "";
  let i = 0;

  while (i < input.length) {
    // Find a variant group: something like `hover:(...)`
    const match = input.slice(i).match(/^([a-zA-Z0-9_-]+:)\(/);

    if (!match) {
      output += input[i++];
      continue;
    }

    const prefix = match[1];
    const start = i + match[0].length;
    let depth = 1;
    let j = start;

    // Find the matching `)`
    while (j < input.length && depth > 0) {
      if (input[j] === "(") depth++;
      else if (input[j] === ")") depth--;
      j++;
    }

    if (depth !== 0) {
      // Unclosed group — leave it alone
      output += input[i++];
      continue;
    }

    const content = input.slice(start, j - 1);

    // Recursively expand nested groups
    const expanded = expandVariantGroups(content);

    // Apply the variant prefix to each top-level token
    const tokens = splitTopLevel(expanded);

    output += tokens.map((token) => prefix + token).join(" ");

    i = j;
  }

  return output;
}

function splitTopLevel(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let parenDepth = 0;
  let bracketDepth = 0;

  for (const char of input) {
    if (char === "(") parenDepth++;
    else if (char === ")") parenDepth--;
    else if (char === "[") bracketDepth++;
    else if (char === "]") bracketDepth--;

    if (/\s/.test(char) && parenDepth === 0 && bracketDepth === 0) {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) tokens.push(current);

  return tokens;
}
