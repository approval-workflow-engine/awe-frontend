// Node Type Definitions

export const NODE_WIDTH = 180;
export const NODE_MIN_HEIGHT = 56;

export interface PaletteNodeType {
  type: string;
  label: string;
  color: string;
}

export const PALETTE_NODES: PaletteNodeType[] = [
  { type: 'user_task',          label: 'User Task',     color: '#4f6ef7' },
  { type: 'service_task',       label: 'Service Task',  color: '#06b6d4' },
  { type: 'script_task',        label: 'Script Task',   color: '#a855f7' },
  { type: 'exclusive_gateway',  label: 'Gateway',       color: '#f59e0b' },
  { type: 'end',                label: 'End Node',      color: '#22c55e' },
];

export function getNodeColor(type: string): string {
  const map: Record<string, string> = {
    start:              '#4f6ef7',
    user_task:          '#4f6ef7',
    service_task:       '#06b6d4',
    script_task:        '#a855f7',
    exclusive_gateway:  '#f59e0b',
    end:                '#22c55e',
  };
  return map[type] || '#8b91a8';
}

export function getEffectiveNodeColor(node: CanvasNode): string {
  if (node.type === 'end') {
    return (node.config.failure as boolean) ? '#ef4444' : '#22c55e';
  }
  return getNodeColor(node.type);
}

export function getNodeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    start:              'Start',
    user_task:          'User Task',
    service_task:       'Service Task',
    script_task:        'Script Task',
    exclusive_gateway:  'Gateway',
    end:                'End Node',
  };
  return map[type] || type;
}

//  Canvas State Types

export interface CanvasNode {
  id: string;
  type: string;
  label: string;
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
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
}

export type SelectedItem =
  | { id: string; type: 'node' }
  | { id: string; type: 'edge' }
  | null;

//  Port System

export interface NodePort {
  id: string;
  label: string;
}

export function getOutputPorts(node: CanvasNode): NodePort[] {
  switch (node.type) {
    case 'exclusive_gateway': {
      const branches = (node.config.branches as Array<{ label: string }>) ?? [];
      return branches.map((b, i) => ({ id: `branch_${i}`, label: b.label || `Branch ${i + 1}` }));
    }
    case 'end':
      return [];
    default:
      return [{ id: 'out', label: '' }];
  }
}

// Returns 0..1 fractional vertical position for port within card
export function portYFraction(portIndex: number, totalPorts: number): number {
  if (totalPorts <= 1) return 0.5;
  return (portIndex + 1) / (totalPorts + 1);
}

// Estimated card height for SVG edge endpoint calculation
export function estimateCardHeight(_node: CanvasNode): number {
  return NODE_MIN_HEIGHT;
}

//  Helpers

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildStartNode(): CanvasNode {
  return {
    id: 'start_1',
    type: 'start',
    label: 'Start',
    config: {},
    x: 80,
    y: 200,
  };
}

// Converts canvas state → API definition payload
export function canvasToDefinition(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  inputs: WorkflowInput[]
) {
  return {
    inputs,
    nodes: nodes.map(n => ({
      id: n.id,
      type: n.type,
      label: n.label,
      config: n.config,
      position: { x: n.x, y: n.y },
    })),
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourcePort: e.sourcePort || undefined,
      condition: e.condition || undefined,
      isDefault: e.isDefault || undefined,
    })),
  };
}

// Converts API version response → canvas state
export function definitionToCanvas(versionData: {
  nodes?: Array<{
    nodeId?: string;
    id?: string;
    type: string;
    label?: string;
    config?: Record<string, unknown>;
    position?: { x: number; y: number };
  }>;
  edges?: Array<{
    edgeId?: string;
    id?: string;
    sourceNodeId?: string;
    source?: string;
    targetNodeId?: string;
    target?: string;
    sourcePort?: string;
    conditionExpression?: string;
    condition?: string;
    isDefault?: boolean;
  }>;
  definition?: {
    inputs?: WorkflowInput[];
    nodes?: Array<{
      id?: string;
      nodeId?: string;
      type: string;
      label?: string;
      config?: Record<string, unknown>;
      position?: { x: number; y: number };
    }>;
    edges?: Array<{
      id?: string;
      edgeId?: string;
      source?: string;
      sourceNodeId?: string;
      target?: string;
      targetNodeId?: string;
      sourcePort?: string;
      conditionExpression?: string;
      condition?: string;
      isDefault?: boolean;
    }>;
  };
}): { nodes: CanvasNode[]; edges: CanvasEdge[]; inputs: WorkflowInput[] } {
  const rawNodes = versionData.nodes || versionData.definition?.nodes || [];
  const rawEdges = versionData.edges || versionData.definition?.edges || [];
  const inputs = versionData.definition?.inputs || [];

  const nodes: CanvasNode[] = rawNodes.map((n, i) => ({
    id: n.nodeId || n.id || generateId('node'),
    type: n.type,
    label: n.label || getNodeTypeLabel(n.type),
    config: (n.config as Record<string, unknown>) || {},
    x: n.position?.x ?? 80 + i * 200,
    y: n.position?.y ?? 200,
  }));

  const edges: CanvasEdge[] = rawEdges.map(e => ({
    id: e.edgeId || e.id || generateId('edge'),
    source: e.sourceNodeId || e.source || '',
    target: e.targetNodeId || e.target || '',
    sourcePort: e.sourcePort || 'out',
    condition: e.conditionExpression || e.condition || '',
    isDefault: e.isDefault || false,
  }));

  return { nodes, edges, inputs };
}
