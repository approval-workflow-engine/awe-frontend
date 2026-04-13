import { DataType } from "../type/types";
import type {
  CanvasNode,
  CanvasEdge,
  WorkflowInput,
  ContextVariable,
} from "../type/types";

export interface AvailableCtxVar {
  id?: string;
  name: string;
  type: string;
  sourceNode: string;
}

function getAncestorIds(
  nodeId: string,
  edges: CanvasEdge[],
): Set<string> {
  const all = new Set<string>();

  edges
    .filter((e) => e.target === nodeId)
    .forEach((e) => {
      all.add(e.source);
    });

  const queue = [...all];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const e of edges) {
      if (e.target === current && !all.has(e.source)) {
        all.add(e.source);
        queue.push(e.source);
      }
    }
  }

  return all;
}

export function getAvailableContext(
  nodeId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  inputs: WorkflowInput[],
): AvailableCtxVar[] {
  const ancestorIds = getAncestorIds(nodeId, edges);
  const vars: AvailableCtxVar[] = [];

  inputs.forEach((i) => {
    if (i.name) vars.push({ name: i.name, type: i.type, sourceNode: "Start" });
  });

  const startNode = nodes.find((n) => n.type === "start");
  if (startNode) {
    const idm =
      (startNode.config.inputDataMap as Array<{
        contextVariableName?: string;
        dataType?: string;
      }>) ?? [];
    idm.forEach((m) => {
      if (
        m.contextVariableName &&
        !vars.some((v) => v.name === m.contextVariableName)
      ) {
        vars.push({
          name: m.contextVariableName,
          type: m.dataType ?? DataType.STRING,
          sourceNode: "Start",
        });
      }
    });
  }

  nodes
    .filter((n) => ancestorIds.has(n.id))
    .forEach((n) => {
      const rm =
        (n.config.responseMap as Array<{
          contextVariable?: ContextVariable;
          type?: string;
        }>) ?? [];
      rm.forEach((row) => {
        const cv = row.contextVariable;
        if (!cv?.name) return;
        vars.push({
          name: cv.name,
          type: row.type ?? DataType.STRING,
          sourceNode: n.label,
        });
      });
    });

  const seen = new Set<string>();
  return vars.filter((v) => {
    if (seen.has(v.name)) return false;
    seen.add(v.name);
    return true;
  });
}
