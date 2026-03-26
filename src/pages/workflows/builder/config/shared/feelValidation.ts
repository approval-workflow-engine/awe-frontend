const DISALLOWED_OPERATORS = [
  { pattern: /===/, message: "Use '=' for equality, not '==='" },
  { pattern: /!==/, message: "Use '!=' for inequality, not '!=='" },
  { pattern: /(?<![!<>])={2}(?!=)/, message: "Use '=' for equality, not '==' "},
];

export type FeelValidationResult = { valid: boolean; error?: string };

export function validateFeelExpressionClient(expression: string): FeelValidationResult {
  const t = expression.trim();
  if (!t) return { valid: false, error: "Expression is empty" };

  for (const { pattern, message } of DISALLOWED_OPERATORS) {
    if (pattern.test(t)) return { valid: false, error: message };
  }

  const unclosedQuotes = (t.match(/(?<!\\)"/g) ?? []).length % 2 !== 0;
  if (unclosedQuotes) return { valid: false, error: "Unclosed string literal" };

  const openParens = (t.match(/\(/g) ?? []).length;
  const closeParens = (t.match(/\)/g) ?? []).length;
  if (openParens !== closeParens) return { valid: false, error: "Unbalanced parentheses" };

  if (/\+\s*$/.test(t) || /^\s*\+/.test(t)) {
    return { valid: false, error: "Expression cannot start or end with '+'" };
  }

  return { valid: true };
}

export function isFeelStringLiteral(expression: string): boolean {
  const t = expression.trim();
  if (!t.startsWith('"') || !t.endsWith('"')) return false;
  const inner = t.slice(1, -1);
  return !inner.includes('"');
}

export function getExpressionKind(expression: string): "string-literal" | "feel-expression" | "empty" {
  const t = expression.trim();
  if (!t) return "empty";
  if (isFeelStringLiteral(t)) return "string-literal";
  return "feel-expression";
}
