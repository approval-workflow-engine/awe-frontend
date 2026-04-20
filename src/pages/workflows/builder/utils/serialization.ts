/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
} from "../../../../types";
import type { CanvasNode, CanvasEdge, WorkflowInput } from "../type/types";
import { generateId } from "./nodeHelpers";

const VALID_HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

type UnknownRecord = Record<string, unknown>;
type CanvasEdgeWithRuleIndex = CanvasEdge & { _ruleIndex?: number };
type BackoffType = "fixed" | "exponential";
type BackoffUnit = "millisecond" | "second" | "minute";
type BackoffConfig = {
  type: BackoffType;
  delay: number;
  unit: BackoffUnit;
};

type TimeoutConfig = {
  delay: number;
  unit: BackoffUnit;
};

type ScriptServiceType = "jdoodle" | "gemini";

type ScriptCredentials = {
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
};

type OnErrorMode = "terminate" | "continue";

const DEFAULT_BACKOFF: BackoffConfig = {
  type: "fixed",
  delay: 1,
  unit: "second",
};

const DEFAULT_TIMEOUT_UNIT: BackoffUnit = "millisecond";

function toApiNodeType(type: string): string {
  switch (type) {
    case "user_task":
      return "user";
    case "service_task":
      return "service";
    case "email_task":
      return "email";
    case "exclusive_gateway":
      return "decision";
    case "script_task":
      return "script";
    default:
      return type;
  }
}

function toCanvasNodeType(type: string): string {
  switch (type) {
    case "user":
      return "user_task";
    case "service":
      return "service_task";
    case "email":
      return "email_task";
    case "decision":
      return "exclusive_gateway";
    case "script":
      return "script_task";
    default:
      return type;
  }
}

const FEEL_START_KEYWORD_REGEX = /^(if|for|some|every|not)\b/i;
const FEEL_BODY_KEYWORD_REGEX = /\b(then|else|satisfies|instance\s+of)\b/i;
const FEEL_BINARY_OPERATOR_REGEX = /\s(=|!=|<=|>=|<|>|and|or|in)\s/i;
const FEEL_FUNCTION_CALL_REGEX =
  /^[A-Za-z_][A-Za-z0-9_]*(?:\s+[A-Za-z_][A-Za-z0-9_]*)*\s*\(/;

function asArray(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? (value as UnknownRecord[]) : [];
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function normalizeBackoff(value: unknown): BackoffConfig {
  const raw = asRecord(value);

  const type: BackoffType =
    raw.type === "exponential" ? "exponential" : DEFAULT_BACKOFF.type;

  const unit: BackoffUnit =
    raw.unit === "millisecond" || raw.unit === "second" || raw.unit === "minute"
      ? raw.unit
      : DEFAULT_BACKOFF.unit;

  const delay =
    typeof raw.delay === "number" && Number.isFinite(raw.delay) && raw.delay > 0
      ? raw.delay
      : DEFAULT_BACKOFF.delay;

  return { type, delay, unit };
}

function normalizeTimeout(value: unknown): TimeoutConfig | undefined {
  const raw = asRecord(value);
  if (!Object.keys(raw).length) {
    return undefined;
  }

  const delay =
    typeof raw.delay === "number" && Number.isFinite(raw.delay) && raw.delay > 0
      ? raw.delay
      : undefined;

  if (delay === undefined) {
    return undefined;
  }

  const unit: BackoffUnit =
    raw.unit === "millisecond" || raw.unit === "second" || raw.unit === "minute"
      ? raw.unit
      : DEFAULT_TIMEOUT_UNIT;

  return {
    delay,
    unit,
  };
}

function normalizeTimeoutFromConfig(config: UnknownRecord): TimeoutConfig | undefined {
  const timeout = normalizeTimeout(config.timeout);
  if (timeout) {
    return timeout;
  }

  if (
    typeof config.timeoutMs === "number" &&
    Number.isFinite(config.timeoutMs) &&
    config.timeoutMs > 0
  ) {
    return {
      delay: config.timeoutMs,
      unit: "millisecond",
    };
  }

  return undefined;
}

function normalizeScriptServiceType(config: UnknownRecord): ScriptServiceType {
  if (config.serviceType === "gemini" || config.executionService === "gemini") {
    return "gemini";
  }

  return "jdoodle";
}

function normalizeScriptCredentials(
  serviceType: ScriptServiceType,
  config: UnknownRecord,
): ScriptCredentials | null {
  const raw = asRecord(config.credentials);

  if (serviceType === "gemini") {
    const apiKey = normalizeFeelStringInput(asString(raw.apiKey));
    return apiKey.trim() ? { apiKey } : null;
  }

  const clientId = normalizeFeelStringInput(asString(raw.clientId));
  const clientSecret = normalizeFeelStringInput(asString(raw.clientSecret));

  if (!clientId.trim() && !clientSecret.trim()) {
    return null;
  }

  return {
    clientId,
    clientSecret,
  };
}

function normalizeDefaultValueForSerialization(
  dataType: string,
  value: unknown,
): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (dataType === "null") {
    return null;
  }

  if (dataType === "number") {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return value;
      }

      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? value : parsed;
    }

    return value;
  }

  if (dataType === "boolean") {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }
    }

    return value;
  }

  if (dataType === "object" || dataType === "list") {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return value;
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
}

function normalizeDefaultValueForCanvas(dataType: string, value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (dataType === "object" || dataType === "list") {
    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return value;
}

function normalizeOnErrorConfiguration(config: unknown): UnknownRecord {
  const raw = asRecord(config);

  const sourceRows = Array.isArray(raw.outputMap)
    ? raw.outputMap
    : Array.isArray(raw.errorMap)
      ? raw.errorMap
      : [];

  const mode: OnErrorMode =
    raw.mode === "continue" || (raw.mode === undefined && sourceRows.length > 0)
      ? "continue"
      : "terminate";

  const outputMap = sourceRows.map((entry: any) => {
    const fromType = entry.fromType === "expression" ? "expression" : "jsonPath";
    const contextVariableName =
      entry.contextVariableName ?? entry.contextVariable?.name ?? "";

    if (fromType === "expression") {
      return {
        fromType,
        valueExpression: entry.valueExpression ?? "",
        contextVariableName,
      };
    }

    return {
      fromType,
      jsonPath: entry.jsonPath ?? "",
      dataType: entry.dataType ?? entry.type ?? "string",
      contextVariableName,
    };
  });

  return {
    mode,
    outputMap: mode === "continue" ? outputMap : [],
  };
}

function normalizeOnErrorConfigurationForCanvas(value: unknown): UnknownRecord {
  const raw = asRecord(value);
  const sourceRows = Array.isArray(raw.outputMap) ? raw.outputMap : [];
  const mode: OnErrorMode =
    raw.mode === "continue" || (raw.mode === undefined && sourceRows.length > 0)
      ? "continue"
      : "terminate";

  const outputMap = sourceRows.map(
    (entry: any) => {
      const fromType = entry.fromType === "expression" ? "expression" : "jsonPath";
      const contextVariable = {
        name: entry.contextVariableName ?? entry.contextVariable?.name ?? "",
        scope: "global" as const,
      };

      if (fromType === "expression") {
        return {
          fromType,
          valueExpression: entry.valueExpression ?? "",
          contextVariable,
        };
      }

      return {
        fromType,
        jsonPath: entry.jsonPath ?? "",
        dataType: entry.dataType ?? entry.type ?? "string",
        contextVariable,
      };
    },
  );

  return {
    mode,
    outputMap: mode === "continue" ? outputMap : [],
  };
}

function toFeelStringLiteral(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function isQuotedFeelStringLiteral(value: string): boolean {
  const t = value.trim();
  return (
    (t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
    (t.startsWith("'") && t.endsWith("'") && t.length >= 2)
  );
}

function normalizeFeelStringInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return isAlreadyFeelExpression(trimmed)
    ? trimmed
    : toFeelStringLiteral(trimmed);
}

function feelStringLiteralToInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return trimmed;
  }

  if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
    const inner = trimmed.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
    return toFeelStringLiteral(inner);
  }

  return isAlreadyFeelExpression(trimmed)
    ? trimmed
    : toFeelStringLiteral(trimmed);
}

function isAlreadyFeelExpression(value: string): boolean {
  const t = value.trim();
  if (!t) return false;
  if (isQuotedFeelStringLiteral(t)) return true;
  if (FEEL_START_KEYWORD_REGEX.test(t)) return true;
  if (FEEL_BODY_KEYWORD_REGEX.test(t)) return true;
  if (FEEL_BINARY_OPERATOR_REGEX.test(t)) return true;
  if (/^\-?\d+(\.\d+)?$/.test(t)) return true;
  if (/^(true|false|null)$/i.test(t)) return true;
  if (FEEL_FUNCTION_CALL_REGEX.test(t)) return true;
  if (t.startsWith("[") || t.startsWith("{")) return true;
  if (/\s[+\-*/]\s/.test(t)) return true;
  if (t.startsWith("string(")) return true;
  if (/\bcontext\.[A-Za-z_]/.test(t)) return true;
  if (/\bsecret\.[A-Za-z_]/.test(t)) return true;
  return false;
}

function isLegacyTemplateStyleUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!/{[^{}]+}/.test(trimmed)) return false;
  if (!trimmed.includes("/")) return false;
  if (isQuotedFeelStringLiteral(trimmed)) return false;
  if (FEEL_START_KEYWORD_REGEX.test(trimmed)) return false;
  if (FEEL_BODY_KEYWORD_REGEX.test(trimmed)) return false;
  if (FEEL_FUNCTION_CALL_REGEX.test(trimmed)) return false;
  if (/\s[+\-*/=<>]\s/.test(trimmed)) return false;
  return true;
}

function templateUrlToFeel(url: string): string {
  if (!url) return '""';
  const trimmed = url.trim();
  if (!trimmed) return '""';

  if (isLegacyTemplateStyleUrl(trimmed)) {
    const parts: string[] = [];
    let lastIndex = 0;
    const regex = /\{([^}]+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(trimmed)) !== null) {
      const staticPart = trimmed.slice(lastIndex, match.index);
      if (staticPart) parts.push(toFeelStringLiteral(staticPart));
      const inner = match[1].trim();
      parts.push(
        inner.startsWith("context.") || inner.startsWith("secret.")
          ? inner
          : `string(${inner})`,
      );
      lastIndex = regex.lastIndex;
    }
    const trailing = trimmed.slice(lastIndex);
    if (trailing) parts.push(toFeelStringLiteral(trailing));
    return parts.join(" + ");
  }

  if (isAlreadyFeelExpression(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\/\S+$/i.test(trimmed)) {
    return toFeelStringLiteral(trimmed);
  }

  if (!trimmed.includes("{")) return toFeelStringLiteral(trimmed);

  return toFeelStringLiteral(trimmed);
}

function feelUrlToTemplate(feel: string): string {
  if (!feel) return "";
  const trimmed = feel.trim();
  if (isLegacyTemplateStyleUrl(trimmed)) {
    return templateUrlToFeel(trimmed);
  }
  return trimmed;
}

function serializeConfiguration(
  apiType: string,
  config: UnknownRecord,
): UnknownRecord {
  switch (apiType) {
    case "start":
      return {
        ...config,
        inputDataMap: Array.isArray(config.inputDataMap)
          ? config.inputDataMap.map((r: any) => ({
              jsonPath: r.jsonPath ?? "",
              dataType: r.dataType ?? r.type ?? "string",
              contextVariableName:
                r.contextVariableName ?? r.contextVariable?.name ?? "",
              fetchableId: r.fetchableId,
              required: r.required !== false,
              defaultValue:
                r.required === false
                  ? normalizeDefaultValueForSerialization(
                      r.dataType ?? r.type ?? "string",
                      r.defaultValue,
                    )
                  : undefined,
            }))
          : [],
        secretDataMap: Array.isArray(config.secretDataMap)
          ? config.secretDataMap.map((s: any) => ({
              secretId: typeof s.secretId === "string" ? s.secretId : "",
              secretVariableName: s.secretKey ?? s.secretVariableName ?? "",
            }))
          : [],
        fetchables: (Array.isArray(config.fetchables)
          ? config.fetchables
          : []
        ).map((f: any) => ({
          ...f,
          method: "GET" as const,
          urlExpression:
            typeof f.urlExpression === "string"
              ? templateUrlToFeel(f.urlExpression)
              : f.urlExpression,
          headers: Array.isArray(f.headers)
            ? f.headers.map((h: any) => ({
                key: h.key ?? "",
                valueExpression: h.valueExpression ?? h.value ?? "",
              }))
            : [],
        })),
      };

    case "end":
      return {
        ...config,
        success: typeof config.success === "boolean" ? config.success : true,
        resultMap: Array.isArray(config.resultMap)
          ? config.resultMap.map((r: any) => ({
              variableName: r.variableName ?? r.contextVariable?.name ?? "",
              valueExpression: r.valueExpression ?? "",
            }))
          : [],
        message:
          typeof config.message === "string" ? config.message : undefined,
      };

    case "script": {
      const rawBackoff = normalizeBackoff(config.backoff);
      const timeout = normalizeTimeoutFromConfig(config);
      const serviceType = normalizeScriptServiceType(config);
      const credentials = normalizeScriptCredentials(serviceType, config);

      return {
        runtime: "python3" as const,
        maxAttempts:
          typeof config.maxAttempts === "number" ? config.maxAttempts : 1,
        ...(timeout ? { timeout } : {}),
        backoff: rawBackoff,
        onError: normalizeOnErrorConfiguration(config.onError),
        sourceCode:
          typeof config.sourceCode === "string" ? config.sourceCode : "",
        entryFunctionName:
          typeof config.entryFunctionName === "string"
            ? config.entryFunctionName
            : "main",
        serviceType,
        ...(credentials ? { credentials } : { credentials: null }),
        parameterMap: Array.isArray(config.parameterMap)
          ? config.parameterMap.map((p: any) => ({
              name: p.name ?? "",
              valueExpression: p.valueExpression ?? "",
            }))
          : [],
        responseMap: Array.isArray(config.responseMap)
          ? config.responseMap.map((r: any) => ({
              jsonPath: r.jsonPath ?? "",
              type: r.type ?? r.dataType ?? "string",
              contextVariableName:
                r.contextVariableName ?? r.contextVariable?.name ?? "",
            }))
          : [],
      };
    }

    case "service": {
      const rawBackoff = normalizeBackoff(config.backoff);
      const svc: UnknownRecord = {
        method: VALID_HTTP_METHODS.includes(
          asString(config.method) as (typeof VALID_HTTP_METHODS)[number],
        )
          ? asString(config.method)
          : "GET",
        urlExpression: templateUrlToFeel(
          typeof config.urlExpression === "string" ? config.urlExpression : "",
        ),
        responseMap: Array.isArray(config.responseMap)
          ? config.responseMap.map((r: any) => ({
              jsonPath: r.jsonPath ?? "",
              type: r.type ?? r.dataType ?? "string",
              contextVariableName:
                r.contextVariableName ?? r.contextVariable?.name ?? "",
            }))
          : [],
      };
      if (typeof config.maxAttempts === "number")
        svc.maxAttempts = config.maxAttempts;
      const timeout = normalizeTimeoutFromConfig(config);
      if (timeout) {
        svc.timeout = timeout;
      }
      svc.backoff = rawBackoff;
      svc.onError = normalizeOnErrorConfiguration(config.onError);
      if ("headers" in config)
        svc.headers = Array.isArray(config.headers)
          ? config.headers.map((h: any) => ({
              key: h.key ?? "",
              valueExpression: h.valueExpression ?? h.value ?? "",
            }))
          : [];
      if ("body" in config)
        svc.body = Array.isArray(config.body)
          ? config.body.map((b: any) => ({
              jsonPath: b.jsonPath ?? "",
              valueExpression: b.valueExpression ?? "",
            }))
          : [];
      return svc;
    }

    case "email": {
      const rawBackoff = normalizeBackoff(config.backoff);
      const to = Array.isArray(config.to) ? config.to : [];
      const cc = Array.isArray(config.cc) ? config.cc : [];
      const bcc = Array.isArray(config.bcc) ? config.bcc : [];

      return {
        provider: asString(config.provider, "google_smtp"),
        senderExpression: normalizeFeelStringInput(
          asString(config.senderExpression),
        ),
        authUserExpression: normalizeFeelStringInput(
          asString(config.authUserExpression),
        ),
        authPassExpression: normalizeFeelStringInput(
          asString(config.authPassExpression),
        ),
        to: to.map((recipient: any) => ({
          valueExpression: normalizeFeelStringInput(
            asString(recipient.valueExpression),
          ),
        })),
        cc: cc.map((recipient: any) => ({
          valueExpression: normalizeFeelStringInput(
            asString(recipient.valueExpression),
          ),
        })),
        bcc: bcc.map((recipient: any) => ({
          valueExpression: normalizeFeelStringInput(
            asString(recipient.valueExpression),
          ),
        })),
        subjectExpression: normalizeFeelStringInput(
          asString(config.subjectExpression),
        ),
        bodyExpression: normalizeFeelStringInput(asString(config.bodyExpression)),
        maxAttempts:
          typeof config.maxAttempts === "number" ? config.maxAttempts : 1,
        backoff: rawBackoff,
        failurePolicy:
          config.failurePolicy === "continue" ? "continue" : "fail",
        responseMap: Array.isArray(config.responseMap)
          ? config.responseMap.map((r: any) => ({
              jsonPath: r.jsonPath ?? "",
              type: r.type ?? r.dataType ?? "string",
              contextVariableName:
                r.contextVariableName ?? r.contextVariable?.name ?? "",
            }))
          : [],
      };
    }

    case "user":
      return {
        ...config,
        title: config.title ?? "",
        description: config.description ?? "",
        assignee: config.assignee ?? "",
        maxAttempts:
          typeof config.maxAttempts === "number" ? config.maxAttempts : 1,
        requestMap: Array.isArray(config.requestMap)
          ? config.requestMap.map((r: any) => ({
              label: r.label ?? "",
              valueExpression: r.valueExpression ?? "",
            }))
          : [],
        responseMap: Array.isArray(config.responseMap)
          ? config.responseMap.map((r: any) => ({
              fieldId: r.fieldId ?? "",
              label: r.label ?? "",
              contextVariableName:
                r.contextVariableName ?? r.contextVariable?.name ?? "",
              type: r.type ?? r.dataType ?? "string",
              required: r.required !== false,
              defaultValue:
                r.required === false
                  ? normalizeDefaultValueForSerialization(
                      r.type ?? r.dataType ?? "string",
                      r.defaultValue,
                    )
                  : undefined,
              uiType: r.uiType,
              options: Array.isArray(r.options)
                ? r.options.map((o: any) => ({
                    label: o.label,
                    valueExpression: o.valueExpression ?? o.value ?? "",
                  }))
                : undefined,
            }))
          : [],
      };

    case "decision":
      return {
        ...config,
        rules: Array.isArray(config.rules) ? config.rules : [],
        defaultRule: {
          ...(config.defaultRule && typeof config.defaultRule === "object"
            ? config.defaultRule
            : {}),
          id: "default" as const,
        },
      };

    default:
      return config;
  }
}

export function canvasToDefinition(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): WorkflowDefinition {
  const resultNodes: WorkflowNode[] = nodes.map((n) => {
    const apiType = toApiNodeType(n.type);
    const res: WorkflowNode = {
      id: generateId("node"),
      nodeId: n.id,
      type: apiType,
      config: serializeConfiguration(
        apiType,
        asRecord(JSON.parse(JSON.stringify(n.config ?? {}))),
      ),
    };
    if (n.label) res.label = n.label;
    if (n.description) res.description = n.description;
    res.position = { x: n.x, y: n.y };
    return res;
  });

  const resultEdges: WorkflowEdge[] = edges.map((e) => {
    const ruleId =
      e.isDefault || e.sourcePort === "default"
        ? "default"
        : e.sourcePort && e.sourcePort !== "out"
          ? e.sourcePort
          : null;

    return {
      id: generateId("edge"),
      edgeId: e.id,
      sourceNodeId: e.source,
      targetNodeId: e.target,
      ruleId,
      conditionExpression: e.condition || undefined,
      isDefault: e.isDefault || false,
    };
  });

  const startNode = nodes.find((n) => n.type === "start");
  let inputs: WorkflowInput[] = [];
  if (startNode?.config?.inputDataMap) {
    inputs = (startNode.config.inputDataMap as any[])
      .filter((i) => !i.fetchableId)
      .map((i) => ({
        name: i.contextVariableName || i.contextVariable?.name || "",
        type: i.dataType || i.type || "string",
        required: i.required !== false,
        defaultValue:
          i.required === false
            ? normalizeDefaultValueForSerialization(
                i.dataType || i.type || "string",
                i.defaultValue,
              )
            : undefined,
      }));
  }

  return { nodes: resultNodes, edges: resultEdges, inputs };
}

export function canvasToVersionPayload(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  description = "",
) {
  const definition = canvasToDefinition(nodes, edges);

  return {
    description,
    nodes: definition.nodes.map((n: any) => {
      const apiType = toApiNodeType(asString(n.type));
      const rawConfig = n.config || n.configuration || {};
      return {
        id: n.nodeId || n.id,
        type: apiType,
        label: n.name || n.label || "",
        description: n.description || null,
        configuration: serializeConfiguration(apiType, asRecord(rawConfig)),
        position: n.position || {
          x: n.x_coordinate || 0,
          y: n.y_coordinate || 0,
        },
      };
    }),
    edges: definition.edges.map((e) => ({
      id: e.edgeId || e.id,
      label: e.conditionExpression || null,
      sourceNodeId: e.sourceNodeId,
      targetNodeId: e.targetNodeId,
      ruleId: e.ruleId ?? null,
    })),
  };
}

export function definitionToCanvas(def: unknown): {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  inputs: WorkflowInput[];
} {
  const root = asRecord(def);
  const nestedDefinition = asRecord(root.definition);
  const rawNodes =
    asArray(root.nodes).length > 0
      ? asArray(root.nodes)
      : asArray(nestedDefinition.nodes);
  const rawEdges =
    asArray(root.edges).length > 0
      ? asArray(root.edges)
      : asArray(nestedDefinition.edges);

  const cNodes: CanvasNode[] = rawNodes.map((n) => ({
    id:
      asString(n.nodeId) ||
      asString(n.id) ||
      asString(n.client_id) ||
      generateId("node"),
    type: asString(n.type),
    label: asString(n.name) || asString(n.label),
    description: asString(n.description) || undefined,
    config: JSON.parse(JSON.stringify(n.config || n.configuration || {})),
    x: asNumber(asRecord(n.position).x, asNumber(n.x_coordinate, 100)),
    y: asNumber(asRecord(n.position).y, asNumber(n.y_coordinate, 100)),
  }));

  const cEdges: CanvasEdgeWithRuleIndex[] = rawEdges.map((e) => ({
    id:
      asString(e.edgeId) ||
      asString(e.id) ||
      asString(e.client_id) ||
      generateId("edge"),
    source:
      asString(e.sourceNodeId) ||
      asString(e.source_node_id) ||
      asString(e.source),
    target:
      asString(e.targetNodeId) ||
      asString(e.destination_node_id) ||
      asString(e.target),
    sourcePort:
      e.ruleId === "default"
        ? "default"
        : asString(e.ruleId) || asString(e.sourcePort) || "out",
    condition:
      asString(e.conditionExpression) ||
      asString(e.condition_expression) ||
      asString(e.condition),
    isDefault: Boolean(e.isDefault || e.ruleId === "default"),
    _ruleIndex:
      typeof e.ruleIndex === "number" ? (e.ruleIndex as number) : undefined,
  }));

  cNodes.forEach((node) => {
    node.type = toCanvasNodeType(node.type);
  });

  cNodes.forEach((node) => {
    if (node.type !== "service_task") return;
    if (typeof node.config.urlExpression === "string") {
      node.config.urlExpression = feelUrlToTemplate(node.config.urlExpression);
    }
    const timeout = normalizeTimeoutFromConfig(node.config);
    if (timeout) {
      node.config.timeout = timeout;
    } else {
      delete node.config.timeout;
    }
    delete node.config.timeoutMs;
    node.config.backoff = normalizeBackoff(node.config.backoff);
    node.config.onError = normalizeOnErrorConfigurationForCanvas(
      node.config.onError,
    );
  });

  cNodes.forEach((node) => {
    if (node.type !== "script_task") return;
    const timeout = normalizeTimeoutFromConfig(node.config);
    if (timeout) {
      node.config.timeout = timeout;
    } else {
      delete node.config.timeout;
    }
    delete node.config.timeoutMs;

    const serviceType = normalizeScriptServiceType(node.config);
    node.config.serviceType = serviceType;
    delete node.config.executionService;

    const rawCredentials = asRecord(node.config.credentials);
    if (serviceType === "gemini") {
      const apiKey = asString(rawCredentials.apiKey);
      node.config.credentials = apiKey.trim()
        ? {
            apiKey: feelStringLiteralToInput(apiKey),
          }
        : null;
    } else {
      const clientId = asString(rawCredentials.clientId);
      const clientSecret = asString(rawCredentials.clientSecret);
      node.config.credentials = clientId.trim() || clientSecret.trim()
        ? {
            clientId: feelStringLiteralToInput(clientId),
            clientSecret: feelStringLiteralToInput(clientSecret),
          }
        : null;
    }

    node.config.backoff = normalizeBackoff(node.config.backoff);
    node.config.onError = normalizeOnErrorConfigurationForCanvas(
      node.config.onError,
    );
  });

  cNodes.forEach((node) => {
    if (node.type !== "email_task") return;

    node.config.provider = asString(node.config.provider, "google_smtp");
    node.config.senderExpression = feelStringLiteralToInput(
      asString(node.config.senderExpression),
    );
    node.config.authUserExpression = feelStringLiteralToInput(
      asString(node.config.authUserExpression),
    );
    node.config.authPassExpression = feelStringLiteralToInput(
      asString(node.config.authPassExpression),
    );

    node.config.to = (Array.isArray(node.config.to) ? node.config.to : []).map(
      (recipient: any) => ({
        valueExpression: feelStringLiteralToInput(
          asString(recipient.valueExpression),
        ),
      }),
    );
    node.config.cc = (Array.isArray(node.config.cc) ? node.config.cc : []).map(
      (recipient: any) => ({
        valueExpression: feelStringLiteralToInput(
          asString(recipient.valueExpression),
        ),
      }),
    );
    node.config.bcc =
      (Array.isArray(node.config.bcc) ? node.config.bcc : []).map(
        (recipient: any) => ({
          valueExpression: feelStringLiteralToInput(
            asString(recipient.valueExpression),
          ),
        }),
      );

    node.config.subjectExpression = feelStringLiteralToInput(
      asString(node.config.subjectExpression),
    );
    node.config.bodyExpression = feelStringLiteralToInput(
      asString(node.config.bodyExpression),
    );
    node.config.maxAttempts = asNumber(node.config.maxAttempts, 1);
    node.config.failurePolicy = asString(node.config.failurePolicy, "fail");
    node.config.backoff = normalizeBackoff(node.config.backoff);
    node.config.responseMap = (Array.isArray(node.config.responseMap)
      ? node.config.responseMap
      : []
    ).map((r: any) => ({
      jsonPath: r.jsonPath ?? "",
      type: r.type ?? "string",
      contextVariable: r.contextVariable ?? {
        name: r.contextVariableName ?? "",
        scope: "global",
      },
    }));
  });

  cNodes.forEach((node) => {
    if (node.type !== "start") return;
    if (!Array.isArray(node.config.fetchables)) return;
    node.config.fetchables = (node.config.fetchables as any[]).map(
      (f: any) => ({
        ...f,
        urlExpression:
          typeof f.urlExpression === "string"
            ? feelUrlToTemplate(f.urlExpression)
            : f.urlExpression,
        headers: Array.isArray(f.headers)
          ? f.headers.map((h: any) => ({
              key: h.key ?? "",
              valueExpression: h.valueExpression ?? h.value ?? "",
            }))
          : [],
      }),
    );

    node.config.inputDataMap = (Array.isArray(node.config.inputDataMap)
      ? node.config.inputDataMap
      : []
    ).map((entry: any) => ({
      ...entry,
      required: entry.required !== false,
      defaultValue:
        entry.required === false
          ? normalizeDefaultValueForCanvas(
              entry.dataType ?? entry.type ?? "string",
              entry.defaultValue,
            )
          : undefined,
    }));
  });

  // Deserialize End node resultMap: variableName → contextVariable
  cNodes.forEach((node) => {
    if (node.type !== "end") return;
    if (!Array.isArray(node.config.resultMap)) return;
    node.config.resultMap = (node.config.resultMap as any[]).map((r: any) => ({
      contextVariable: r.contextVariable ?? {
        name: r.variableName ?? "",
        scope: "global",
      },
      valueExpression: r.valueExpression ?? "",
      validationExpression: r.validationExpression,
    }));
  });

  // Deserialize User node responseMap: contextVariableName → contextVariable
  cNodes.forEach((node) => {
    if (node.type !== "user_task") return;
    if (!Array.isArray(node.config.responseMap)) return;
    node.config.responseMap = (node.config.responseMap as any[]).map(
      (r: any) => ({
        fieldId: r.fieldId ?? "",
        label: r.label ?? "",
        contextVariable: r.contextVariable ?? {
          name: r.contextVariableName ?? "",
          scope: "global",
        },
        type: r.type ?? "string",
        required: r.required !== false,
        defaultValue:
          r.required === false
            ? normalizeDefaultValueForCanvas(r.type ?? "string", r.defaultValue)
            : undefined,
        uiType: r.uiType,
        options: r.options,
      }),
    );
  });

  // Deserialize Service/Script node responseMap: contextVariableName → contextVariable
  cNodes.forEach((node) => {
    if (node.type !== "service_task" && node.type !== "script_task") return;
    if (!Array.isArray(node.config.responseMap)) return;
    node.config.responseMap = (node.config.responseMap as any[]).map(
      (r: any) => ({
        jsonPath: r.jsonPath ?? "",
        type: r.type ?? "string",
        contextVariable: r.contextVariable ?? {
          name: r.contextVariableName ?? "",
          scope: "global",
        },
      }),
    );
  });

  // START NODE SECRETS
  cNodes.forEach((node) => {
    if (node.type !== "start") return;
    if (Array.isArray(node.config.secretDataMap)) {
      node.config.secretDataMap = (node.config.secretDataMap as any[]).map(
        (s: any) => ({
          secretId: typeof s.secretId === "string" ? s.secretId : "",
          secretKey: s.secretKey ?? s.secretVariableName ?? "",
        }),
      );
    }
  });

  cNodes.forEach((gatewayNode) => {
    if (gatewayNode.type !== "exclusive_gateway") return;
    const rules =
      (gatewayNode.config?.rules as Array<{
        id: string;
        conditionExpression?: string;
        label?: string;
      }>) ?? [];
    if (rules.length === 0) return;

    const gatewayEdges = cEdges.filter(
      (e) => e.source === gatewayNode.id && !e.isDefault,
    );

    const assignedRuleIds = new Set<string>();
    for (const edge of gatewayEdges) {
      const rule = rules.find((r) => r.id === edge.sourcePort);
      if (rule) {
        assignedRuleIds.add(rule.id);
        if (!edge.condition && rule.conditionExpression) {
          edge.condition = rule.conditionExpression;
        }
      }
    }

    for (const edge of gatewayEdges) {
      if (assignedRuleIds.has(edge.sourcePort)) continue;
      const ruleIndex = edge._ruleIndex;
      if (
        typeof ruleIndex === "number" &&
        ruleIndex >= 0 &&
        ruleIndex < rules.length
      ) {
        const rule = rules[ruleIndex];
        if (!assignedRuleIds.has(rule.id)) {
          edge.sourcePort = rule.id;
          assignedRuleIds.add(rule.id);
          if (!edge.condition && rule.conditionExpression) {
            edge.condition = rule.conditionExpression;
          }
        }
      }
    }

    for (const edge of gatewayEdges) {
      if (assignedRuleIds.has(edge.sourcePort)) continue;
      if (!edge.condition) continue;
      const matched = rules.find(
        (r) =>
          r.conditionExpression &&
          r.conditionExpression === edge.condition &&
          !assignedRuleIds.has(r.id),
      );
      if (matched) {
        edge.sourcePort = matched.id;
        assignedRuleIds.add(matched.id);
      }
    }

    const remainingRules = rules.filter((r) => !assignedRuleIds.has(r.id));
    let rIdx = 0;
    for (const edge of gatewayEdges) {
      if (assignedRuleIds.has(edge.sourcePort)) continue;
      if (rIdx < remainingRules.length) {
        edge.sourcePort = remainingRules[rIdx].id;
        if (!edge.condition && remainingRules[rIdx].conditionExpression) {
          edge.condition = remainingRules[rIdx].conditionExpression ?? "";
        }
        rIdx++;
      }
    }

    for (const edge of gatewayEdges) {
      delete edge._ruleIndex;
    }
  });

  const startNode = cNodes.find((n) => n.type === "start");
  let inputs: WorkflowInput[] = [];
  if (startNode?.config?.inputDataMap) {
    inputs = (startNode.config.inputDataMap as any[])
      .filter((i) => !i.fetchableId)
      .map((i) => ({
        name: i.contextVariableName || i.contextVariable?.name || "",
        type: i.dataType || i.type || "string",
        required: i.required !== false,
        defaultValue:
          i.required === false
            ? normalizeDefaultValueForCanvas(
                i.dataType || i.type || "string",
                i.defaultValue,
              )
            : undefined,
      }));
  }

  return { nodes: cNodes, edges: cEdges as CanvasEdge[], inputs };
}
