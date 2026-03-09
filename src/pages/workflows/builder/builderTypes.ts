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
    const success = node.config.success as boolean | undefined;
    // legacy: failure flag (inverted); new: success flag
    const isFailure = (success === false) || ((node.config as Record<string, unknown>).failure === true);
    return isFailure ? '#ef4444' : '#22c55e';
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

//  Schema Types 

export const DataType = {
  NUMBER:   'number',
  STRING:   'string',
  BOOLEAN:  'boolean',
  DATE:     'date',
  TIME:     'time',
  DATETIME: 'date-time',
  LIST:     'list',
  OBJECT:   'object',
  NULL:     'null',
} as const;

export type DataType = (typeof DataType)[keyof typeof DataType];

export interface ContextVariable {
  name: string;
  scope: 'global' | 'next';
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
      const rules = (node.config.rules as Array<{ id: string; label?: string }>) ?? [];
      const defaultRule = (node.config.defaultRule as { id?: string; label?: string } | undefined);
      const defaultId = defaultRule?.id ?? 'default';
      const defaultLabel = defaultRule?.label || 'Default';
      return [
        ...rules.map(r => ({ id: r.id, label: r.label || 'Condition' })),
        { id: defaultId, label: defaultLabel },
      ];
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
    config: { inputDataMap: [] },
    x: 80,
    y: 200,
  };
}

//  Serialization (Canvas → API Definition) 

function serializeNodeConfig(node: CanvasNode): Record<string, unknown> {
  const c = node.config;

  if (node.type === 'start') {
    return { inputDataMap: c.inputDataMap ?? [] };
  }

  if (node.type === 'end') {
    return {
      success: c.success ?? true,
      message: c.message ?? undefined,
      resultMap: c.resultMap ?? [],
    };
  }

  if (node.type === 'user_task') {
    return {
      title: c.title,
      description: c.description,
      assignee: c.assignee,
      maxAttempts: c.maxAttempts,
      requestMap: c.requestMap ?? [],
      responseMap: c.responseMap ?? [],
    };
  }

  if (node.type === 'service_task') {
    return {
      method: c.method || 'GET',
      urlExpression: c.urlExpression ?? '',
      maxAttempts: c.maxAttempts,
      timeoutMs: c.timeoutMs,
      retryDelayMs: c.retryDelayMs,
      headers: c.headers ?? [],
      body: c.body ?? [],
      responseMap: c.responseMap ?? [],
      onError: c.onError,
    };
  }

  if (node.type === 'script_task') {
    return {
      runtime: 'python3',
      sourceCode: c.sourceCode ?? '',
      entryFunctionName: c.entryFunctionName ?? 'main',
      maxAttempts: c.maxAttempts,
      parameterMap: c.parameterMap ?? [],
      responseMap: c.responseMap ?? [],
      onError: c.onError,
    };
  }

  if (node.type === 'exclusive_gateway') {
    return {
      rules: c.rules ?? [],
      defaultRule: c.defaultRule ?? { id: 'default' },
    };
  }

  return c;
}

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
      config: serializeNodeConfig(n),
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

//  Deserialization (API Definition → Canvas) 

type KVArr = Array<{ key: string; value: string }>;

function kvArrToNewFormat<T>(arr: KVArr | undefined, mapFn: (row: { key: string; value: string }) => T): T[] {
  return (arr ?? []).filter(r => r.key || r.value).map(mapFn);
}

function deserializeNodeConfig(type: string, c: Record<string, unknown>): Record<string, unknown> {
  if (type === 'start') {
    // InputDataMap may already be in new format or missing
    return { inputDataMap: c.inputDataMap ?? [] };
  }

  if (type === 'end') {
    // Backward compat: old schema had failure:bool, new has success:bool
    if (c.success !== undefined) return c; // already new format
    const wasFailure = c.failure === true;
    return {
      success: !wasFailure,
      message: c.message,
      resultMap: (c.resultMap as unknown[]) ?? [],
    };
  }

  if (type === 'user_task') {
    // Detect old KVRow requestMap format
    const reqRaw = c.requestMap;
    const resRaw = c.responseMap;
    const newReqMap: Array<{ label: string; valueExpression: string }> =
      Array.isArray(reqRaw) && reqRaw.length > 0 && 'key' in (reqRaw[0] as object)
        ? kvArrToNewFormat(reqRaw as KVArr, r => ({ label: r.key, valueExpression: r.value }))
        : (reqRaw as Array<{ label: string; valueExpression: string }>) ?? [];

    let newResMap: unknown[];
    if (Array.isArray(resRaw) && resRaw.length > 0 && 'name' in (resRaw[0] as object) && !('fieldId' in (resRaw[0] as object))) {
      // Old format: {name, label, type, defaultValue}
      const old = resRaw as Array<{ name?: string; label?: string; type?: string; defaultValue?: unknown }>;
      newResMap = old.map(r => ({
        fieldId: r.name ?? generateId('field'),
        label: r.label ?? r.name ?? '',
        type: r.type ?? DataType.STRING,
        required: false,
        contextVariable: r.name ? { name: r.name, scope: 'global' as const } : undefined,
      }));
    } else {
      newResMap = (resRaw as unknown[]) ?? [];
    }

    return {
      title: c.title,
      description: c.description,
      assignee: c.assignee,
      maxAttempts: c.maxAttempts,
      requestMap: newReqMap,
      responseMap: newResMap,
    };
  }

  if (type === 'service_task') {
    // Detect old format: had url instead of urlExpression
    const urlExpr = (c.urlExpression as string) ?? (c.url as string) ?? '';
    const headersRaw = c.headers;
    const bodyRaw = c.body ?? c.requestMap; // old: requestMap, new: body
    const resRaw = c.responseMap;

    const newHeaders: Array<{ key: string; valueExpression: string }> =
      Array.isArray(headersRaw) && headersRaw.length > 0 && 'key' in (headersRaw[0] as object)
        ? kvArrToNewFormat(headersRaw as KVArr, r => ({ key: r.key, valueExpression: r.value }))
        : (headersRaw as Array<{ key: string; valueExpression: string }>) ?? [];

    const newBody: Array<{ jsonPath: string; valueExpression: string }> =
      Array.isArray(bodyRaw) && bodyRaw.length > 0 && 'key' in (bodyRaw[0] as object)
        ? kvArrToNewFormat(bodyRaw as KVArr, r => ({ jsonPath: r.key, valueExpression: r.value }))
        : (bodyRaw as Array<{ jsonPath: string; valueExpression: string }>) ?? [];

    let newResMap: unknown[];
    if (Array.isArray(resRaw) && resRaw.length > 0 && 'key' in (resRaw[0] as object)) {
      // Old KVRow: key=varName, value=jsonKey
      newResMap = kvArrToNewFormat(resRaw as KVArr, r => ({
        jsonPath: r.value,
        type: DataType.STRING,
        contextVariable: r.key ? { name: r.key, scope: 'global' as const } : undefined,
      }));
    } else if (Array.isArray(resRaw) && resRaw.length > 0 && typeof (resRaw[0] as Record<string, unknown>).key === 'string') {
      newResMap = [];
    } else {
      newResMap = (resRaw as unknown[]) ?? [];
    }

    return {
      method: c.method || 'GET',
      urlExpression: urlExpr,
      maxAttempts: c.maxAttempts,
      timeoutMs: c.timeoutMs,
      retryDelayMs: c.retryDelayMs,
      headers: newHeaders,
      body: newBody,
      responseMap: newResMap,
      onError: c.onError,
    };
  }

  if (type === 'script_task') {
    const paramRaw = c.parameterMap;
    // Old format: {key, value}[]; new: {name, valueExpression}[]
    const newParams: Array<{ name: string; valueExpression: string }> =
      Array.isArray(paramRaw) && paramRaw.length > 0 && 'key' in (paramRaw[0] as object)
        ? kvArrToNewFormat(paramRaw as KVArr, r => ({ name: r.key, valueExpression: r.value }))
        : (paramRaw as Array<{ name: string; valueExpression: string }>) ?? [];

    // scriptOutputs (old) → responseMap (new)
    const resRaw = c.responseMap;
    const scriptOutputs = c.scriptOutputs;
    let newResMap: unknown[];
    if (Array.isArray(resRaw) && resRaw.length > 0) {
      newResMap = resRaw as unknown[];
    } else if (Array.isArray(scriptOutputs) && scriptOutputs.length > 0) {
      const old = scriptOutputs as Array<{ name?: string; type?: string }>;
      newResMap = old.map(o => ({
        jsonPath: o.name ?? '',
        type: (o.type as DataType) ?? DataType.STRING,
        contextVariable: o.name ? { name: o.name, scope: 'global' as const } : undefined,
      }));
    } else {
      newResMap = [];
    }

    return {
      runtime: 'python3',
      sourceCode: c.sourceCode ?? '',
      entryFunctionName: (c.entryFunctionName as string) ?? (c.mainFunction as string) ?? 'main',
      maxAttempts: c.maxAttempts,
      parameterMap: newParams,
      responseMap: newResMap,
      onError: c.onError,
      // keep codeMode / file fields for ScriptTaskEditorPanel
      codeMode: c.codeMode,
      attachedFileName: c.attachedFileName,
      fileCodeOriginal: c.fileCodeOriginal,
    };
  }

  if (type === 'exclusive_gateway') {
    // Detect old format: had branches[] array
    if (Array.isArray(c.branches)) {
      const oldBranches = c.branches as Array<{ label?: string; condition?: string | null }>;
      const nonDefault = oldBranches.filter(b => b.label !== 'Default' && b.condition !== null);
      return {
        rules: nonDefault.map((b, i) => ({
          id: generateId('rule'),
          label: b.label ?? `Condition ${i + 1}`,
          conditionExpression: b.condition ?? '',
        })),
        defaultRule: { id: 'default', label: 'Default' },
      };
    }
    return {
      rules: (c.rules as unknown[]) ?? [],
      defaultRule: c.defaultRule ?? { id: 'default' },
    };
  }

  return c;
}

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
    config: deserializeNodeConfig(n.type, (n.config as Record<string, unknown>) || {}),
    x: n.position?.x ?? (100 + i * 220),
    y: n.position?.y ?? 200,
  }));

  const edges: CanvasEdge[] = rawEdges.map(e => ({
    id: e.edgeId || e.id || generateId('edge'),
    source: e.sourceNodeId || e.source || '',
    target: e.targetNodeId || e.target || '',
    sourcePort: e.sourcePort || '',
    condition: e.conditionExpression || e.condition || '',
    isDefault: e.isDefault ?? false,
  }));

  return { nodes, edges, inputs };
}
