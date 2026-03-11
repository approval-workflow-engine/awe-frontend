import { DataType } from "../type/builderTypes";

export const DATA_TYPE_TO_UI_TYPE: Record<string, string> = {
  [DataType.STRING]: "text",
  [DataType.NUMBER]: "number",
  [DataType.BOOLEAN]: "checkbox",
  [DataType.DATE]: "date-picker",
  [DataType.DATETIME]: "date-picker",
  [DataType.TIME]: "date-picker",
  [DataType.LIST]: "dropdown",
  [DataType.OBJECT]: "textarea",
  [DataType.NULL]: "text",
};

export function getDefaultUiType(type: string): string {
  return DATA_TYPE_TO_UI_TYPE[type] ?? "text";
}

/*
 * Recursively flattens a JSON object into an array of { jsonPath, valueExpression } rows.
 * Context variable references like "{context.foo}" are preserved as-is in valueExpression.
 */
export function flattenJsonToBody(
  obj: unknown,
  prefix = "",
): Array<{ jsonPath: string; valueExpression: string }> {
  if (obj === null) {
    return prefix ? [{ jsonPath: prefix, valueExpression: "null" }] : [];
  }
  if (typeof obj === "string") {
    const m = obj.match(/^\{(context\.\w+(?:\.\w+)*)\}$/);
    const valueExpression = m ? m[1] : JSON.stringify(obj);
    return prefix ? [{ jsonPath: prefix, valueExpression }] : [];
  }
  if (typeof obj === "number" || typeof obj === "boolean") {
    return prefix ? [{ jsonPath: prefix, valueExpression: String(obj) }] : [];
  }
  if (typeof obj === "object" && !Array.isArray(obj)) {
    const result: Array<{ jsonPath: string; valueExpression: string }> = [];
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      result.push(...flattenJsonToBody(v, prefix ? `${prefix}.${k}` : k));
    }
    return result;
  }
  return prefix
    ? [{ jsonPath: prefix, valueExpression: JSON.stringify(obj) }]
    : [];
}

/* Reconstructs a JSON string from flattened body rows. */
export function bodyToJson(
  body: Array<{ jsonPath: string; valueExpression: string }>,
): string {
  if (!body.length) return "";
  const obj: Record<string, unknown> = {};
  for (const { jsonPath, valueExpression } of body) {
    const parts = jsonPath.split(".");
    let cur: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof cur[parts[i]] !== "object" || cur[parts[i]] === null) {
        cur[parts[i]] = {};
      }
      cur = cur[parts[i]] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (!last) continue;
    if (valueExpression.startsWith("context.")) {
      cur[last] = `{${valueExpression}}`;
    } else {
      try {
        cur[last] = JSON.parse(valueExpression);
      } catch {
        cur[last] = valueExpression;
      }
    }
  }
  return JSON.stringify(obj, null, 2);
}
