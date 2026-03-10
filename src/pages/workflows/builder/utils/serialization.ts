/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
} from "../../../../types";
import type { CanvasNode, CanvasEdge, WorkflowInput } from "../type/types";
import { generateId } from "./nodeHelpers";

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
    inputs = (startNode.config.inputDataMap as any[]).map((i) => ({
      name: i.contextVariable?.name || "",
      type: i.type || "string",
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
    nodes: definition.nodes.map((n: any) => ({
      id: n.nodeId || n.id,
      type:
        n.type === "user_task"
          ? "user"
          : n.type === "service_task"
            ? "service"
            : n.type === "exclusive_gateway"
              ? "decision"
              : n.type === "script_task"
                ? "script"
                : n.type,
      label: n.name || n.label || "",
      configuration: n.config || n.configuration || {},
      position: n.position || {
        x: n.x_coordinate || 0,
        y: n.y_coordinate || 0,
      },
    })),
    edges: edges.map((e) => {
      // For gateway edges, include ruleIndex as a reliable fallback identifier.
      // ruleIndex = position of this rule in the gateway's rules array.
      // This lets us reassign sourcePort correctly even if the backend doesn't
      // return ruleId or conditionExpression after reload.
      let ruleIndex: number | undefined;
      if (!e.isDefault && e.sourcePort) {
        const srcNode = nodes.find((n) => n.id === e.source);
        if (srcNode?.type === "exclusive_gateway") {
          const rules = (srcNode.config.rules as Array<{ id: string }>) ?? [];
          const idx = rules.findIndex((r) => r.id === e.sourcePort);
          if (idx >= 0) ruleIndex = idx;
        }
      }
      return {
        id: e.id,
        sourceNodeId: e.source,
        targetNodeId: e.target,
        // Use sourcePort (rule UUID) as ruleId so branch identity is preserved on reload
        ruleId: e.isDefault ? "default" : e.sourcePort || null,
        // Store the FEEL expression separately so it can be shown on the edge label
        conditionExpression: e.isDefault ? null : e.condition || null,
        // Positional index within the gateway's rules array — reliable backup on reload
        ...(ruleIndex !== undefined && { ruleIndex }),
      };
    }),
  };
}

export function definitionToCanvas(def: unknown): {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  inputs: WorkflowInput[];
} {
  // Support both flat shape { nodes, edges } and nested shape { definition: { nodes, edges } }
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
    position: {
      x: n.position?.x ?? n.x_coordinate ?? 100,
      y: n.position?.y ?? n.y_coordinate ?? 100,
    },
  }));

  const cEdges: CanvasEdge[] = rawEdges.map((e: any) => ({
    id: e.edgeId || e.id || e.client_id || generateId("edge"),
    source: e.sourceNodeId || e.source_node_id || e.source || "",
    target: e.targetNodeId || e.destination_node_id || e.target || "",
    // Use ruleId directly as sourcePort (rule UUID) to correctly identify the gateway port
    sourcePort:
      e.ruleId === "default" ? "default" : e.ruleId || e.sourcePort || "out",
    // Prefer conditionExpression for display
    condition:
      e.conditionExpression || e.condition_expression || e.condition || "",
    isDefault: e.isDefault || e.ruleId === "default" || false,
    // Preserve ruleIndex for Phase 2 matching
    _ruleIndex: typeof e.ruleIndex === "number" ? e.ruleIndex : undefined,
  }));

  cNodes.forEach((node) => {
    if (node.type === "user") node.type = "user_task";
    if (node.type === "service") node.type = "service_task";
    if (node.type === "decision") node.type = "exclusive_gateway";
    if (node.type === "script") node.type = "script_task";
  });

  // Restore gateway sourcePort using the best available match strategy
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

    // Phase 1: sourcePort already matches a rule id directly (ideal new format)
    const assignedRuleIds = new Set<string>();
    for (const edge of gatewayEdges) {
      const rule = rules.find((r) => r.id === (edge as any).sourcePort);
      if (rule) {
        assignedRuleIds.add(rule.id);
        if (!edge.condition && rule.conditionExpression) {
          edge.condition = rule.conditionExpression;
        }
      }
    }

    // Phase 2: match unresolved edges by ruleIndex (saved index in rules array)
    for (const edge of gatewayEdges) {
      if (assignedRuleIds.has((edge as any).sourcePort)) continue; // already matched
      const ruleIndex: number | undefined = (edge as any)._ruleIndex;
      if (
        typeof ruleIndex === "number" &&
        ruleIndex >= 0 &&
        ruleIndex < rules.length
      ) {
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

    // Phase 3: match by conditionExpression (legacy format)
    for (const edge of gatewayEdges) {
      if (assignedRuleIds.has((edge as any).sourcePort)) continue;
      if (!edge.condition) continue;
      const matched = rules.find(
        (r) =>
          r.conditionExpression &&
          r.conditionExpression === edge.condition &&
          !assignedRuleIds.has(r.id),
      );
      if (matched) {
        (edge as any).sourcePort = matched.id;
        assignedRuleIds.add(matched.id);
      }
    }

    // Phase 4: positional fallback — assign remaining rules to remaining unresolved edges
    const remainingRules = rules.filter((r) => !assignedRuleIds.has(r.id));
    let rIdx = 0;
    for (const edge of gatewayEdges) {
      if (assignedRuleIds.has((edge as any).sourcePort)) continue;
      if (rIdx < remainingRules.length) {
        (edge as any).sourcePort = remainingRules[rIdx].id;
        if (!edge.condition && remainingRules[rIdx].conditionExpression) {
          edge.condition = remainingRules[rIdx].conditionExpression ?? "";
        }
        rIdx++;
      }
    }

    // Clean up temporary field
    for (const edge of gatewayEdges) {
      delete (edge as any)._ruleIndex;
    }
  });

  const startNode = cNodes.find((n) => n.type === "start");
  let inputs: WorkflowInput[] = [];
  if (startNode?.config?.inputDataMap) {
    inputs = (startNode.config.inputDataMap as any[]).map((i) => ({
      name: i.contextVariable?.name || "",
      type: i.type || "string",
      required: i.required || false,
    }));
  }

  return { nodes: cNodes, edges: cEdges, inputs };
}
