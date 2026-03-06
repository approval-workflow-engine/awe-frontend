import { useState } from 'react';
import {
  Box, Typography, IconButton, TextField,
  Select, MenuItem, FormControl, InputLabel, Switch,
  Divider, Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { type CanvasNode, type CanvasEdge, type SelectedItem, type WorkflowInput, getEffectiveNodeColor, getNodeTypeLabel } from './builderTypes';

//  Helpers 
function getAncestorIds(nodeId: string, edges: CanvasEdge[]): Set<string> {
  const visited = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const e of edges) {
      if (e.target === current && !visited.has(e.source)) {
        visited.add(e.source);
        queue.push(e.source);
      }
    }
  }
  return visited;
}

function getNodeOutputKeys(node: CanvasNode): string[] {
  const rm = node.config.responseMap as Record<string, unknown> | undefined;
  const pm = node.config.parameterMap as Record<string, unknown> | undefined;
  const map = rm || pm;
  if (!map) return [];
  return Object.keys(map);
}

function getUsageHint(nodeType: string): { title: string; example: string } | null {
  if (nodeType === 'script_task') return {
    title: 'Available in parameterMap',
    example: '{ "amount": "{{context.amount}}" }',
  };
  if (nodeType === 'service_task') return {
    title: 'Available in URL, headers, and requestMap',
    example: 'URL: /orders/{{context.orderId}}\nHeader: Authorization: {{context.token}}',
  };
  if (nodeType === 'user_task') return {
    title: 'Available in requestMap',
    example: '{ "applicant": "{{context.userName}}" }',
  };
  if (nodeType === 'exclusive_gateway') return {
    title: 'Available in edge conditions',
    example: 'context.amount > 1000\ncontext.status === "approved"',
  };
  return null;
}

//  Context Variables Section 
function ContextVariablesSection({
  node, allNodes, edges, inputs,
}: {
  node: CanvasNode;
  allNodes: CanvasNode[];
  edges: CanvasEdge[];
  inputs: WorkflowInput[];
}) {
  const [open, setOpen] = useState(false);

  const ancestorIds = getAncestorIds(node.id, edges);
  const ancestors = allNodes.filter(n => ancestorIds.has(n.id) && n.type !== 'start');
  const hint = getUsageHint(node.type);

  const hasVars = inputs.length > 0 || ancestors.some(n => getNodeOutputKeys(n).length > 0);

  if (!hasVars && !hint) return null;

  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 'auto', flexShrink: 0 }}>
      {/* Toggle header */}
      <Box
        display="flex" alignItems="center" justifyContent="space-between"
        sx={{ px: 1.5, py: 1, cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
        onClick={() => setOpen(o => !o)}
      >
        <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.disabled' }}>
          Available Variables
        </Typography>
        {open ? <ExpandLessIcon sx={{ fontSize: 14, color: 'text.disabled' }} /> : <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.disabled' }} />}
      </Box>

      <Collapse in={open}>
        <Box sx={{ px: 1.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>

          {/* Workflow inputs */}
          {inputs.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.disabled', mb: 0.5 }}>
                Workflow Inputs
              </Typography>
              <Box sx={{ p: 1, backgroundColor: 'action.hover', borderRadius: '6px', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {inputs.map(inp => (
                  <Box key={inp.name} display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#a855f7', flexShrink: 0 }}>
                      context.{inp.name}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
                      {inp.type}{inp.required ? '' : '?'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Upstream node outputs */}
          {ancestors.map(ancestor => {
            const keys = getNodeOutputKeys(ancestor);
            if (keys.length === 0) return null;
            return (
              <Box key={ancestor.id}>
                <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.disabled', mb: 0.5 }}>
                  {ancestor.label}
                </Typography>
                <Box sx={{ p: 1, backgroundColor: 'action.hover', borderRadius: '6px', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  {keys.map(key => (
                    <Typography key={key} sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#06b6d4' }}>
                      context.{key}
                    </Typography>
                  ))}
                </Box>
              </Box>
            );
          })}

          {/* Usage hint */}
          {hint && (
            <Box sx={{ p: 1, backgroundColor: 'rgba(79,110,247,0.06)', borderRadius: '6px', border: '1px solid rgba(79,110,247,0.15)' }}>
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#4f6ef7', mb: 0.5 }}>
                {hint.title}
              </Typography>
              <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'text.secondary', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {hint.example}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

//  JSON Field 
function JsonField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const isValid = !value.trim() || (() => { try { JSON.parse(value); return true; } catch { return false; } })();
  return (
    <TextField
      fullWidth
      multiline
      minRows={3}
      maxRows={8}
      label={label}
      size="small"
      value={value}
      onChange={e => onChange(e.target.value)}
      error={!!value.trim() && !isValid}
      helperText={!!value.trim() && !isValid ? 'Invalid JSON' : ''}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
        },
      }}
    />
  );
}

//  Node Config 
function NodeConfigSection({
  node, onChange,
}: { node: CanvasNode; onChange: (config: Record<string, unknown>) => void }) {
  const c = node.config;
  const set = (key: string, val: unknown) => onChange({ ...c, [key]: val });
  const jsonStr = (val: unknown) => (val && typeof val === 'object' ? JSON.stringify(val, null, 2) : (val as string) || '');
  const parseJson = (s: string): Record<string, unknown> | undefined => {
    if (!s.trim()) return undefined;
    try { return JSON.parse(s) as Record<string, unknown>; } catch { return undefined; }
  };

  const labelField = (
    <TextField
      fullWidth label="Label" size="small" value={(c.label as string) || node.label}
      onChange={e => { set('label', e.target.value); onChange({ ...c, label: e.target.value }); }}
      sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
    />
  );

  if (node.type === 'start') {
    return (
      <Box sx={{ p: 1.5 }}>
        <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
          The Start node has no configuration. It is the entry point of the workflow.
        </Typography>
      </Box>
    );
  }

  if (node.type === 'exclusive_gateway') {
    return (
      <Box sx={{ p: 1.5 }}>
        {labelField}
        <Box sx={{ p: 1.5, borderRadius: '8px', backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Typography sx={{ fontSize: 11, color: '#f59e0b', lineHeight: 1.5 }}>
            Routing logic is defined on outgoing edges — add a condition expression to each edge, and mark one as the default fallback.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (node.type === 'end') {
    return (
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {labelField}
        <Box
          display="flex" alignItems="center" justifyContent="space-between"
          sx={{ p: 1.5, borderRadius: '8px', backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider' }}
        >
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.primary' }}>Failure End</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Instance transitions to FAILED status</Typography>
          </Box>
          <Switch
            size="small"
            checked={!!(c.failure as boolean)}
            onChange={e => set('failure', e.target.checked)}
          />
        </Box>
      </Box>
    );
  }

  if (node.type === 'user_task') {
    return (
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {labelField}
        <TextField fullWidth label="Task Title *" size="small" value={(c.title as string) || ''}
          onChange={e => set('title', e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
        <TextField fullWidth label="Assignee Email *" size="small" value={(c.assignee as string) || ''}
          onChange={e => set('assignee', e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
        <TextField fullWidth label="Description" size="small" multiline minRows={2} value={(c.description as string) || ''}
          onChange={e => set('description', e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
        <JsonField label="Request Map (JSON)"
          value={jsonStr(c.requestMap)}
          onChange={v => { const p = parseJson(v); if (p !== undefined) set('requestMap', p); }} />
        <JsonField label="Response Map (JSON)"
          value={jsonStr(c.responseMap)}
          onChange={v => { const p = parseJson(v); if (p !== undefined) set('responseMap', p); }} />
      </Box>
    );
  }

  if (node.type === 'service_task') {
    return (
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {labelField}
        <FormControl fullWidth size="small">
          <InputLabel>HTTP Method</InputLabel>
          <Select
            label="HTTP Method"
            value={(c.method as string) || 'GET'}
            onChange={e => set('method', e.target.value)}
            sx={{ borderRadius: '8px' }}
          >
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField fullWidth label="URL *" size="small" value={(c.url as string) || ''}
          onChange={e => set('url', e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
        <JsonField label="Headers (JSON)"
          value={jsonStr(c.headers)}
          onChange={v => { const p = parseJson(v); if (p !== undefined) set('headers', p); }} />
        <JsonField label="Request Map (JSON)"
          value={jsonStr(c.requestMap)}
          onChange={v => { const p = parseJson(v); if (p !== undefined) set('requestMap', p); }} />
        <JsonField label="Response Map (JSON)"
          value={jsonStr(c.responseMap)}
          onChange={v => { const p = parseJson(v); if (p !== undefined) set('responseMap', p); }} />
      </Box>
    );
  }

  if (node.type === 'script_task') {
    return (
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {labelField}
        <TextField fullWidth label="Main Function Name *" size="small" value={(c.mainFunction as string) || ''}
          onChange={e => set('mainFunction', e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 } }} />
        <TextField fullWidth label="Source Code *" size="small" multiline minRows={6} maxRows={16}
          value={(c.sourceCode as string) || ''}
          onChange={e => set('sourceCode', e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 } }} />
        <JsonField label="Parameter Map (JSON)"
          value={jsonStr(c.parameterMap)}
          onChange={v => { const p = parseJson(v); if (p !== undefined) set('parameterMap', p); }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1.5 }}>
      <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>No configuration for this node type.</Typography>
    </Box>
  );
}

//  Edge Config 
function EdgeConfig({
  edge, onChange,
}: { edge: CanvasEdge; onChange: (updates: Partial<CanvasEdge>) => void }) {
  return (
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <TextField
        fullWidth
        label="Condition Expression"
        size="small"
        value={edge.condition || ''}
        onChange={e => onChange({ condition: e.target.value })}
        placeholder="context.amount > 1000"
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 } }}
        helperText="JavaScript expression evaluated against context"
      />
      <Box
        display="flex" alignItems="center" justifyContent="space-between"
        sx={{ p: 1.5, borderRadius: '8px', backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider' }}
      >
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.primary' }}>Default Edge</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Taken when no other condition matches</Typography>
        </Box>
        <Switch
          size="small"
          checked={edge.isDefault}
          onChange={e => onChange({ isDefault: e.target.checked })}
        />
      </Box>

      {/* Condition examples */}
      <Box sx={{ p: 1, backgroundColor: 'rgba(79,110,247,0.06)', borderRadius: '6px', border: '1px solid rgba(79,110,247,0.15)' }}>
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#4f6ef7', mb: 0.5 }}>
          Condition examples
        </Typography>
        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'text.secondary', whiteSpace: 'pre', lineHeight: 1.6 }}>
          {'context.amount > 1000\ncontext.status === "approved"\ncontext.role === "admin"'}
        </Typography>
      </Box>
    </Box>
  );
}

//  Main Config Panel 
interface ConfigPanelProps {
  selectedItem: SelectedItem;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  inputs: WorkflowInput[];
  onClose: () => void;
  onUpdateNode: (id: string, updates: Partial<CanvasNode>) => void;
  onUpdateEdge: (id: string, updates: Partial<CanvasEdge>) => void;
}

export default function ConfigPanel({
  selectedItem, nodes, edges, inputs, onClose, onUpdateNode, onUpdateEdge,
}: ConfigPanelProps) {
  if (!selectedItem) return null;

  const selectedNode = selectedItem.type === 'node'
    ? nodes.find(n => n.id === selectedItem.id)
    : null;
  const selectedEdge = selectedItem.type === 'edge'
    ? edges.find(e => e.id === selectedItem.id)
    : null;

  if (!selectedNode && !selectedEdge) return null;

  const color = selectedNode ? getEffectiveNodeColor(selectedNode) : '#4f6ef7';
  const typeLabel = selectedNode ? getNodeTypeLabel(selectedNode.type) : 'Edge';

  return (
    <Box
      sx={{
        width: 288,
        flexShrink: 0,
        borderLeft: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 1.5,
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
              {selectedNode ? selectedNode.label || typeLabel : 'Edge Config'}
            </Typography>
            {selectedNode && (
              <Typography sx={{ fontSize: 10, color: 'text.disabled', fontFamily: "'JetBrains Mono', monospace" }}>
                {typeLabel}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.disabled', p: 0.25 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {selectedNode && (
          <>
            <NodeConfigSection
              node={selectedNode}
              onChange={config => {
                onUpdateNode(selectedNode.id, { config, label: (config.label as string) || selectedNode.label });
              }}
            />
            <Divider sx={{ borderColor: 'divider' }} />
            <ContextVariablesSection
              node={selectedNode}
              allNodes={nodes}
              edges={edges}
              inputs={inputs}
            />
          </>
        )}
        {selectedEdge && (
          <EdgeConfig
            edge={selectedEdge}
            onChange={updates => onUpdateEdge(selectedEdge.id, updates)}
          />
        )}
      </Box>
    </Box>
  );
}
