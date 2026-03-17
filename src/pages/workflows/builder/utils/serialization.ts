/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from "../../../../types";
import type { CanvasNode, CanvasEdge, WorkflowInput } from "../type/types";
import { generateId } from "./nodeHelpers";

const VALID_HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function templateUrlToFeel(url: string): string {
    if (!url) return '""';
    if (!url.includes('{')) return `"${url}"`;
    const parts: string[] = [];
    let lastIndex = 0;
    const regex = /\{([^}]+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(url)) !== null) {
        const staticPart = url.slice(lastIndex, match.index);
        if (staticPart) parts.push(`"${staticPart}"`);
        parts.push(`string(${match[1]})`);
        lastIndex = regex.lastIndex;
    }
    const trailing = url.slice(lastIndex);
    if (trailing) parts.push(`"${trailing}"`);
    return parts.join(' + ');
}

function feelUrlToTemplate(feel: string): string {
    if (!feel) return '';
    if (!feel.startsWith('"') && !feel.startsWith('string(')) return feel;
    const parts = feel.split(' + ');
    let result = '';
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            result += trimmed.slice(1, -1);
        } else if (trimmed.startsWith('string(') && trimmed.endsWith(')')) {
            result += `{${trimmed.slice(7, -1)}}`;
        } else {
            return feel;
        }
    }
    return result;
}

function serializeConfiguration(apiType: string, config: Record<string, any>): Record<string, any> {
    switch (apiType) {
        case "start":
            return {
                ...config,
                inputDataMap: Array.isArray(config.inputDataMap) ? config.inputDataMap : [],
                fetchables: (Array.isArray(config.fetchables) ? config.fetchables : []).map((f: any) => ({
                    ...f,
                    urlExpression: typeof f.urlExpression === "string" ? templateUrlToFeel(f.urlExpression) : f.urlExpression,
                    headers: Array.isArray(f.headers) ? f.headers.map((h: any) => ({
                        key: h.key ?? "",
                        valueExpression: h.valueExpression ?? h.value ?? "",
                    })) : [],
                })),
            };

        case "end":
            return {
                ...config,
                success: typeof config.success === "boolean" ? config.success : true,
                resultMap: Array.isArray(config.resultMap) ? config.resultMap : [],
            };

        case "script": {
            return {
                ...config,
                runtime: "python3" as const,
                sourceCode: typeof config.sourceCode === "string" ? config.sourceCode : "",
                entryFunctionName: typeof config.entryFunctionName === "string" ? config.entryFunctionName : "main",
                parameterMap: Array.isArray(config.parameterMap) ? config.parameterMap : [],
                responseMap: Array.isArray(config.responseMap) ? config.responseMap : [],
            };
        }

        case "service": {
            const svc: Record<string, any> = {
                ...config,
                method: VALID_HTTP_METHODS.includes(config.method) ? config.method : "GET",
                urlExpression: templateUrlToFeel(typeof config.urlExpression === "string" ? config.urlExpression : ""),
                responseMap: Array.isArray(config.responseMap) ? config.responseMap : [],
            };
            if ("headers" in config) svc.headers = Array.isArray(config.headers) ? config.headers : [];
            if ("body" in config) svc.body = Array.isArray(config.body) ? config.body : [];
            return svc;
        }

        case "user":
            return {
                ...config,
                requestMap: Array.isArray(config.requestMap) ? config.requestMap : [],
                responseMap: Array.isArray(config.responseMap) ? config.responseMap : [],
            };

        case "decision":
            return {
                ...config,
                rules: Array.isArray(config.rules) ? config.rules : [],
                defaultRule: {
                    ...(config.defaultRule && typeof config.defaultRule === "object" ? config.defaultRule : {}),
                    id: "default" as const,
                },
            };

        default:
            return config;
    }
}

export function canvasToDefinition(
    nodes: CanvasNode[],
    edges: CanvasEdge[]
): WorkflowDefinition {
    const resultNodes: WorkflowNode[] = nodes.map((n) => {
        const res: WorkflowNode = {
            id: generateId("node"),
            nodeId: n.id,
            type: n.type,
            config: JSON.parse(JSON.stringify(n.config)),
        };
        if (n.label) res.label = n.label;
        res.position = { x: n.x, y: n.y };
        return res;
    });

    const resultEdges: WorkflowEdge[] = edges.map((e) => {
        return {
            id: generateId("edge"),
            edgeId: e.id,
            sourceNodeId: e.source,
            targetNodeId: e.target,
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
    description = ""
) {
    const definition = canvasToDefinition(nodes, edges);

    return {
        description,
        nodes: definition.nodes.map((n: any) => {
            const apiType =
                n.type === "user_task" ? "user" :
                n.type === "service_task" ? "service" :
                n.type === "exclusive_gateway" ? "decision" :
                n.type === "script_task" ? "script" :
                n.type;
            const rawConfig = n.config || n.configuration || {};
            return {
                id: n.nodeId || n.id,
                type: apiType,
                label: n.name || n.label || "",
                configuration: serializeConfiguration(apiType, rawConfig),
                position: n.position || { x: n.x_coordinate || 0, y: n.y_coordinate || 0 },
            };
        }),
        edges: edges.map(e => ({
            id: e.id,
            sourceNodeId: e.source,
            targetNodeId: e.target,
            ruleId: e.isDefault ? "default" : (e.sourcePort || null),
        })),
    };
}

export function definitionToCanvas(
    def: unknown
): { nodes: CanvasNode[]; edges: CanvasEdge[]; inputs: WorkflowInput[] } {
    const defAny = def as any;
    const rawNodes: any[] = defAny.nodes || defAny.definition?.nodes || [];
    const rawEdges: any[] = defAny.edges || defAny.definition?.edges || [];

    const cNodes: CanvasNode[] = rawNodes.map((n: any) => ({
        id: n.nodeId || n.id || n.client_id || generateId("node"),
        type: n.type,
        label: n.name || n.label || "",
        config: JSON.parse(JSON.stringify(n.config || n.configuration || {})),
        x: n.position?.x ?? n.x_coordinate ?? 100,
        y: n.position?.y ?? n.y_coordinate ?? 100,
    }));

    const cEdges: CanvasEdge[] = rawEdges.map((e: any) => ({
        id: e.edgeId || e.id || e.client_id || generateId("edge"),
        source: e.sourceNodeId || e.source_node_id || e.source || "",
        target: e.targetNodeId || e.destination_node_id || e.target || "",
        sourcePort: e.ruleId === "default" ? "default" : (e.ruleId || e.sourcePort || "out"),
        condition: e.conditionExpression || e.condition_expression || e.condition || "",
        isDefault: e.isDefault || e.ruleId === "default" || false,
        _ruleIndex: typeof e.ruleIndex === "number" ? e.ruleIndex : undefined,
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
    });

    cNodes.forEach((node) => {
        if (node.type !== "start") return;
        if (!Array.isArray(node.config.fetchables)) return;
        node.config.fetchables = (node.config.fetchables as any[]).map((f: any) => ({
            ...f,
            urlExpression: typeof f.urlExpression === "string" ? feelUrlToTemplate(f.urlExpression) : f.urlExpression,
            headers: Array.isArray(f.headers) ? f.headers.map((h: any) => ({
                key: h.key ?? "",
                valueExpression: h.valueExpression ?? h.value ?? "",
            })) : [],
        }));
    });

    cNodes.forEach((gatewayNode) => {
        if (gatewayNode.type !== "exclusive_gateway") return;
        const rules = (gatewayNode.config?.rules as Array<{ id: string; conditionExpression?: string; label?: string }>) ?? [];
        if (rules.length === 0) return;

        const gatewayEdges = cEdges.filter(e => e.source === gatewayNode.id && !e.isDefault);

        const assignedRuleIds = new Set<string>();
        for (const edge of gatewayEdges) {
            const rule = rules.find(r => r.id === (edge as any).sourcePort);
            if (rule) {
                assignedRuleIds.add(rule.id);
                if (!edge.condition && rule.conditionExpression) {
                    edge.condition = rule.conditionExpression;
                }
            }
        }

        for (const edge of gatewayEdges) {
            if (assignedRuleIds.has((edge as any).sourcePort)) continue;
            const ruleIndex: number | undefined = (edge as any)._ruleIndex;
            if (typeof ruleIndex === "number" && ruleIndex >= 0 && ruleIndex < rules.length) {
                const rule = rules[ruleIndex];
                if (!assignedRuleIds.has(rule.id)) {
                    (edge as any).sourcePort = rule.id;
                    assignedRuleIds.add(rule.id);
                    if (!edge.condition && rule.conditionExpression) {
                        edge.condition = rule.conditionExpression;
                    }
                }
            }
        }

        for (const edge of gatewayEdges) {
            if (assignedRuleIds.has((edge as any).sourcePort)) continue;
            if (!edge.condition) continue;
            const matched = rules.find(r =>
                r.conditionExpression && r.conditionExpression === edge.condition && !assignedRuleIds.has(r.id)
            );
            if (matched) {
                (edge as any).sourcePort = matched.id;
                assignedRuleIds.add(matched.id);
            }
        }

        const remainingRules = rules.filter(r => !assignedRuleIds.has(r.id));
        let rIdx = 0;
        for (const edge of gatewayEdges) {
            if (assignedRuleIds.has((edge as any).sourcePort)) continue;
            if (rIdx < remainingRules.length) {
                (edge as any).sourcePort = remainingRules[rIdx].id;
                if (!edge.condition && remainingRules[rIdx].conditionExpression) {
                    edge.condition = remainingRules[rIdx].conditionExpression ?? '';
                }
                rIdx++;
            }
        }

        for (const edge of gatewayEdges) {
            delete (edge as any)._ruleIndex;
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

    return { nodes: cNodes, edges: cEdges, inputs };
}
