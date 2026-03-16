import { DataType } from "../type/types";

export const EXPR_FONT = "'JetBrains Mono', monospace";
export const EXPR_FS = 11;
export const EXPR_LH = 18;
export const EXPR_PAD_V = 5;
export const EXPR_PAD_L = 46;
export const EXPR_PAD_R = 8;

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export const METHOD_COLORS: Record<string, string> = {
  GET: "#22c55e",
  POST: "#4f6ef7",
  PUT: "#f59e0b",
  PATCH: "#a855f7",
  DELETE: "#ef4444",
};

export const DATA_TYPE_COLORS: Record<string, string> = {
  [DataType.STRING]: "#86efac",
  [DataType.NUMBER]: "#93c5fd",
  [DataType.BOOLEAN]: "#c084fc",
  [DataType.OBJECT]: "#fdba74",
  [DataType.LIST]: "#67e8f9",
  [DataType.DATE]: "#fda4af",
  [DataType.TIME]: "#fda4af",
  [DataType.DATETIME]: "#fda4af",
  [DataType.NULL]: "#94a3b8",
};

export const UI_COLORS = {
  error: "#ef4444",
  success: "#22c55e",
  warning: "#f59e0b",
  primary: "#4f6ef7",
  secondary: "#a855f7",
  info: "#06b6d4",
} as const;

export const VERSION_STATUS_COLOR: Record<string, string> = {
  draft: "#a855f7",
  valid: "#06b6d4",
  published: "#f59e0b",
  active: "#22c55e",
};

export const VERSION_STATUS_BG: Record<string, string> = {
  draft: "rgba(168,85,247,0.12)",
  valid: "rgba(6,182,212,0.12)",
  published: "rgba(245,158,11,0.12)",
  active: "rgba(34,197,94,0.12)",
};

