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

function toFeelStringLiteral(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function isAlreadyFeelExpression(value: string): boolean {
  const t = value.trim();
  if (t.includes(" + ")) return true;
  if (t.startsWith("string(")) return true;
  if (/\bcontext\.[A-Za-z_]/.test(t)) return true;
  if (/^[A-Za-z_][A-Za-z0-9_.]*\s*\(/.test(t)) return true;
  if (t.startsWith('"') && t.endsWith('"') && !t.slice(1, -1).includes('"'))
    return true;
  return false;
}

function templateUrlToFeel(url: string): string {
  if (!url) return '""';
  const trimmed = url.trim();
  if (!trimmed) return '""';

  if (isAlreadyFeelExpression(trimmed)) {
    return trimmed;
  }

  if (/^https?:\/\/\S+$/i.test(trimmed)) {
    return toFeelStringLiteral(trimmed);
  }

  if (!trimmed.includes("{")) return toFeelStringLiteral(trimmed);

  const parts: string[] = [];
  let lastIndex = 0;
  const regex = /\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(trimmed)) !== null) {
    const staticPart = trimmed.slice(lastIndex, match.index);
    if (staticPart) parts.push(toFeelStringLiteral(staticPart));
    const inner = match[1].trim();
    parts.push(inner.startsWith("context.") ? inner : `string(${inner})`);
    lastIndex = regex.lastIndex;
  }
  const trailing = trimmed.slice(lastIndex);
  if (trailing) parts.push(toFeelStringLiteral(trailing));
  return parts.join(" + ");
}

function feelUrlToTemplate(feel: string): string {
  if (!feel) return "";
  if (!feel.startsWith('"') && !feel.startsWith("string(")) return feel;
  const parts = feel.split(" + ");
  let result = "";
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      result += trimmed.slice(1, -1);
    } else if (trimmed.startsWith("string(") && trimmed.endsWith(")")) {
      result += `{${trimmed.slice(7, -1)}}`;
    } else {
      return feel;
    }
  }
  return result;
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
      const rawBackoff = asRecord(config.backoff);
      const backoff: UnknownRecord | undefined =
        Object.keys(rawBackoff).length > 0
          ? {
              type: rawBackoff.type === "exponential" ? "exponential" : "fixed",
              delayMs:
                typeof rawBackoff.delayMs === "number"
                  ? rawBackoff.delayMs
                  : typeof config.retryDelayMs === "number"
                    ? config.retryDelayMs
                    : 1000,
            }
          : typeof config.retryDelayMs === "number"
            ? { type: "fixed", delayMs: config.retryDelayMs }
            : undefined;

      return {
        runtime: "python3" as const,
        maxAttempts:
          typeof config.maxAttempts === "number" ? config.maxAttempts : 1,
        ...(backoff ? { backoff } : {}),
        sourceCode:
          typeof config.sourceCode === "string" ? config.sourceCode : "",
        entryFunctionName:
          typeof config.entryFunctionName === "string"
            ? config.entryFunctionName
            : "main",
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
      const rawBackoff = asRecord(config.backoff);
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
      if (typeof config.timeoutMs === "number")
        svc.timeoutMs = config.timeoutMs;
      if (Object.keys(rawBackoff).length > 0) {
        const delay =
          typeof rawBackoff.delayMs === "number"
            ? rawBackoff.delayMs
            : typeof config.retryDelayMs === "number"
              ? config.retryDelayMs
              : 1000;
        svc.backoff = {
          type: rawBackoff.type === "exponential" ? "exponential" : "fixed",
          delayMs: delay,
        };
      } else if (typeof config.retryDelayMs === "number") {
        svc.backoff = { type: "fixed", delayMs: config.retryDelayMs };
      }
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
    const res: WorkflowNode = {
      id: generateId("node"),
      nodeId: n.id,
      type: n.type,
      config: JSON.parse(JSON.stringify(n.config)),
    };
    if (n.label) res.label = n.label;
    if (n.description) res.description = n.description;
    res.position = { x: n.x, y: n.y };
    return res;
  });

  const resultEdges: WorkflowEdge[] = edges.map((e) => {
    return {
      id: generateId("edge"),
      edgeId: e.id,
      sourceNodeId: e.source,
      targetNodeId: e.target,
      ruleId: e.isDefault ? "default" : e.sourcePort,
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
        required: i.required || false,
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
      const apiType =
        n.type === "user_task"
          ? "user"
          : n.type === "service_task"
            ? "service"
            : n.type === "exclusive_gateway"
              ? "decision"
              : n.type === "script_task"
                ? "script"
                : n.type;
      const rawConfig = n.config || n.configuration || {};
      return {
        id: n.nodeId || n.id,
        type: apiType,
        label: n.name || n.label || "",
        description: n.description || null,
        configuration: serializeConfiguration(apiType, rawConfig),
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
  console.log("Deserializing definition:", def);
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
    if (node.type === "user") node.type = "user_task";
    if (node.type === "service") node.type = "service_task";
    if (node.type === "decision") node.type = "exclusive_gateway";
    if (node.type === "script") node.type = "script_task";
  });

  cNodes.forEach((node) => {
    if (node.type !== "service_task") return;
    if (typeof node.config.urlExpression === "string") {
      node.config.urlExpression = feelUrlToTemplate(node.config.urlExpression);
    }
    // Migrate legacy retryDelayMs into backoff if needed
    if (!node.config.backoff && typeof node.config.retryDelayMs === "number") {
      node.config.backoff = {
        type: "fixed",
        delayMs: node.config.retryDelayMs,
      };
    }
  });

  // Script node: migrate legacy retryDelayMs into backoff for UI
  cNodes.forEach((node) => {
    if (node.type !== "script_task") return;
    if (!node.config.backoff && typeof node.config.retryDelayMs === "number") {
      node.config.backoff = {
        type: "fixed",
        delayMs: node.config.retryDelayMs,
      };
    }
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
        required: i.required || false,
      }));
  }

  return { nodes: cNodes, edges: cEdges as CanvasEdge[], inputs };
}
