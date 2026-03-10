import { DataType } from "../type/builderTypes";
import type {
  CanvasNode,
  CanvasEdge,
  WorkflowInput,
  ContextVariable,
} from "../type/builderTypes";

export interface AvailableCtxVar {
  name: string;
  type: string;
  sourceNode: string;
  scope?: "global" | "next";
}

function getAncestorIds(
  nodeId: string,
  edges: CanvasEdge[],
): { all: Set<string>; direct: Set<string> } {
  const all = new Set<string>();
  const direct = new Set<string>();

  edges
    .filter((e) => e.target === nodeId)
    .forEach((e) => {
      direct.add(e.source);
      all.add(e.source);
    });

  const queue = [...direct];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const e of edges) {
      if (e.target === current && !all.has(e.source)) {
        all.add(e.source);
        queue.push(e.source);
      }
    }
  }

  return { all, direct };
}

export function getAvailableContext(
  nodeId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  inputs: WorkflowInput[],
): AvailableCtxVar[] {
  const { all: ancestorIds, direct: directParentIds } = getAncestorIds(
    nodeId,
    edges,
  );
  const vars: AvailableCtxVar[] = [];

  // Workflow-level inputs provided at launch
  inputs.forEach((i) => {
    if (i.name) vars.push({ name: i.name, type: i.type, sourceNode: "Start" });
  });

  // Context variables declared in the Start node's input data map
  const startNode = nodes.find((n) => n.type === "start");
  if (startNode) {
    const idm =
      (startNode.config.inputDataMap as Array<{
        contextVariable?: ContextVariable;
        type?: string;
      }>) ?? [];
    idm.forEach((m) => {
      if (
        m.contextVariable?.name &&
        !vars.some((v) => v.name === m.contextVariable!.name)
      ) {
        vars.push({
          name: m.contextVariable.name,
          type: m.type ?? DataType.STRING,
          sourceNode: "Start",
          scope: m.contextVariable.scope,
        });
      }
    });
  }

  // Context variables produced by upstream nodes via their response maps
  nodes
    .filter((n) => ancestorIds.has(n.id))
    .forEach((n) => {
      const isDirect = directParentIds.has(n.id);
      const rm =
        (n.config.responseMap as Array<{
          contextVariable?: ContextVariable;
          type?: string;
        }>) ?? [];
      rm.forEach((row) => {
        const cv = row.contextVariable;
        if (!cv?.name) return;
        // next-scoped vars are only visible to the immediately following node
        if (cv.scope === "next" && !isDirect) return;
        vars.push({
          name: cv.name,
          type: row.type ?? DataType.STRING,
          sourceNode: n.label,
          scope: cv.scope,
        });
      });
    });

  // Deduplicate: first occurrence wins
  const seen = new Set<string>();
  return vars.filter((v) => {
    if (seen.has(v.name)) return false;
    seen.add(v.name);
    return true;
  });
}
