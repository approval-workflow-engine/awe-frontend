import type { CanvasNode, NodePort } from "../type/types";
import { NODE_MIN_HEIGHT } from "../type/types";

export function getNodeColor(type: string): string {
  const map: Record<string, string> = {
    start: "#4f6ef7",
    user_task: "#4f6ef7",
    service_task: "#06b6d4",
    script_task: "#a855f7",
    exclusive_gateway: "#f59e0b",
    end: "#22c55e",
  };
  return map[type] || "#8b91a8";
}

export function getEffectiveNodeColor(node: CanvasNode): string {
  if (node.type === "end") {
    const success = node.config.success as boolean | undefined;
    const isFailure =
      success === false ||
      (node.config as Record<string, unknown>).failure === true;
    return isFailure ? "#ef4444" : "#22c55e";
  }
  return getNodeColor(node.type);
}

export function getNodeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    start: "Start",
    user_task: "User Task",
    service_task: "Service Task",
    script_task: "Script Task",
    exclusive_gateway: "Gateway",
    end: "End Node",
  };
  return map[type] || type;
}

export function getOutputPorts(node: CanvasNode): NodePort[] {
  switch (node.type) {
    case "exclusive_gateway": {
      const rules =
        (node.config.rules as Array<{ id: string; label?: string }>) ?? [];
      const defaultRule = node.config.defaultRule as
        | { id?: string; label?: string }
        | undefined;
      const defaultId = defaultRule?.id ?? "default";
      const defaultLabel = defaultRule?.label || "Default";
      return [
        ...rules.map((r) => ({ id: r.id, label: r.label || "Condition" })),
        { id: defaultId, label: defaultLabel },
      ];
    }
    case "end":
      return [];
    default:
      return [{ id: "out", label: "" }];
  }
}

export function portYFraction(portIndex: number, totalPorts: number): number {
  if (totalPorts <= 1) return 0.5;
  return (portIndex + 1) / (totalPorts + 1);
}

export function estimateCardHeight(_node: CanvasNode): number {
  return NODE_MIN_HEIGHT;
}

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildStartNode(): CanvasNode {
  return {
    id: "start_1",
    type: "start",
    label: "Start",
    config: { inputDataMap: [], fetchables: [] },
    x: 80,
    y: 200,
  };
}
