export const NODE_WIDTH = 180;
export const NODE_MIN_HEIGHT = 56;

export interface PaletteNodeType {
    type: string;
    label: string;
    color: string;
}

export const PALETTE_NODES: PaletteNodeType[] = [
    { type: "user_task", label: "User Task", color: "#4f6ef7" },
    { type: "service_task", label: "Service Task", color: "#06b6d4" },
    { type: "email_task", label: "Email Task", color: "#f97316" },
    { type: "script_task", label: "Script Task", color: "#a855f7" },
    { type: "exclusive_gateway", label: "Gateway", color: "#f59e0b" },
    { type: "end", label: "End Node", color: "#22c55e" },
];

export const DataType = {
    NUMBER: "number",
    STRING: "string",
    BOOLEAN: "boolean",
    DATE: "date",
    TIME: "time",
    DATETIME: "date-time",
    LIST: "list",
    OBJECT: "object",
    NULL: "null",
} as const;

export type DataType = (typeof DataType)[keyof typeof DataType];

export interface ContextVariable {
    name: string;
    scope: "global";
}

export interface CanvasNode {
    id: string;
    type: string;
    label: string;
    description?: string;
    config: Record<string, unknown>;
    x: number;
    y: number;
}

export interface CanvasEdge {
    id: string;
    source: string;
    target: string;
    sourcePort: string;
    condition: string;
    isDefault: boolean;
}

export interface WorkflowInput {
    name: string;
    type: "string" | "number" | "boolean" | "object";
    required: boolean;
    defaultValue?: unknown;
}

export type OnErrorMode = "terminate" | "continue";

export interface OnErrorJsonPathOutputMap {
    fromType: "jsonPath";
    jsonPath: string;
    dataType: string;
    contextVariable: ContextVariable;
}

export interface OnErrorExpressionOutputMap {
    fromType: "expression";
    valueExpression: string;
    contextVariable: ContextVariable;
}

export type OnErrorOutputMap =
    | OnErrorJsonPathOutputMap
    | OnErrorExpressionOutputMap;

export interface OnErrorConfig {
    mode: OnErrorMode;
    outputMap: OnErrorOutputMap[];
}

export type SelectedItem =
    | { id: string; type: "node" }
    | { id: string; type: "edge" }
    | null;

export interface NodePort {
    id: string;
    label: string;
}
