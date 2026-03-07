import React, { useRef, useState } from 'react';
import {
  Box, Typography, IconButton, TextField, Select, MenuItem, FormControl,
  Button, Switch, Chip, Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import HttpIcon from '@mui/icons-material/Http';
import CodeIcon from '@mui/icons-material/Code';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EditIcon from '@mui/icons-material/Edit';
import {
  type CanvasNode, type CanvasEdge, type SelectedItem, type WorkflowInput,
  getEffectiveNodeColor, getNodeTypeLabel,
} from './builderTypes';

//  Context var helpers

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

function getAvailableVars(nodeId: string, allNodes: CanvasNode[], edges: CanvasEdge[], inputs: WorkflowInput[]): Set<string> {
  const ancestorIds = getAncestorIds(nodeId, edges);
  const vars = new Set(inputs.map(i => i.name));
  allNodes
    .filter(n => ancestorIds.has(n.id))
    .forEach(n => {
      const rm = n.config.responseMap as Record<string, unknown> | Array<unknown> | undefined;
      // Object format  keys become variable names
      if (rm && !Array.isArray(rm)) Object.keys(rm).forEach(k => vars.add(k));
      // Array format - user_task uses {label}, service_task uses {key, value} where value = context var name
      if (Array.isArray(rm)) {
        (rm as Array<{ label?: string; value?: string }>).forEach(r => {
          if (r.label) vars.add(r.label);
          if (r.value) vars.add(r.value);
        });
      }
      // Script task declared outputs
      if (n.type === 'script_task') {
        const outputs = (n.config.scriptOutputs as Array<{ name: string }>) ?? [];
        outputs.forEach(o => { if (o.name) vars.add(o.name); });
      }
    });
  return vars;
}

//  Shared helpers

interface KVRow { key: string; value: string; }
interface ResponseMapRow { key: string; value: string; type: string; }

const RESPONSE_TYPES = ['string', 'number', 'boolean', 'object'] as const;

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '6px', fontSize: 11,
    '& fieldset': { borderColor: 'divider' },
  },
  '& .MuiInputLabel-root': { fontSize: 11 },
  '& .MuiFormHelperText-root': { fontSize: 9, mt: 0.25 },
};

const monoSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '6px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
    '& fieldset': { borderColor: 'divider' },
  },
  '& .MuiInputLabel-root': { fontSize: 11 },
};

// Render text with context.xxx tokens styled as amber code badges
function HighlightedText({ text }: { text: string }) {
  const parts = text.split(/(context\.\w+)/g);
  return (
    <Box component="span">
      {parts.map((p, i) =>
        /^context\.\w+$/.test(p)
          ? <Box key={i} component="span" sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 'inherit',
              backgroundColor: 'rgba(245,158,11,0.12)',
              color: '#f59e0b',
              fontWeight: 600,
              px: 0.5,
              borderRadius: '3px',
              border: '1px solid rgba(245,158,11,0.2)',
              display: 'inline',
            }}>{p}</Box>
          : <span key={i}>{p}</span>
      )}
    </Box>
  );
}

// Chips below a field showing detected context.xxx tokens
function ContextVarChips({ text, availableVars }: { text: string; availableVars: Set<string> }) {
  const tokens = [...new Set((text.match(/context\.(\w+)/g) ?? []))];
  if (!tokens.length) return null;
  return (
    <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
      {tokens.map(t => {
        const name = t.replace('context.', '');
        const ok = availableVars.has(name);
        return (
          <Chip key={t} label={t} size="small" sx={{
            fontSize: 9, height: 16, fontFamily: "'JetBrains Mono', monospace",
            backgroundColor: ok ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
            color: ok ? '#f59e0b' : '#ef4444',
            border: `1px solid ${ok ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
            '& .MuiChip-label': { px: 0.75 },
          }} />
        );
      })}
    </Box>
  );
}

function KeyValueRows({ rows, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value', addLabel = 'Add Row', availableVars }: {
  rows: KVRow[]; onChange: (rows: KVRow[]) => void;
  keyPlaceholder?: string; valuePlaceholder?: string; addLabel?: string;
  availableVars?: Set<string>;
}) {
  const update = (idx: number, patch: Partial<KVRow>) => onChange(rows.map((r, i) => i === idx ? { ...r, ...patch } : r));
  const remove = (idx: number) => onChange(rows.filter((_, i) => i !== idx));
  return (
    <Box display="flex" flexDirection="column" gap={0.75}>
      {rows.map((row, idx) => (
        <Box key={idx}>
          <Box display="flex" gap={0.5} alignItems="center">
            <TextField size="small" placeholder={keyPlaceholder} value={row.key}
              onChange={e => update(idx, { key: e.target.value })}
              sx={{ flex: 1, ...fieldSx }} inputProps={{ style: { padding: '4px 8px', fontSize: 11 } }} />
            <TextField size="small" placeholder={valuePlaceholder} value={row.value}
              onChange={e => update(idx, { value: e.target.value })}
              sx={{ flex: 1, ...monoSx }} inputProps={{ style: { padding: '4px 8px', fontSize: 11 } }} />
            <IconButton size="small" onClick={() => remove(idx)}
              sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
              <DeleteOutlineIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Box>
          {availableVars && row.value && (
            <ContextVarChips text={row.value} availableVars={availableVars} />
          )}
        </Box>
      ))}
      <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 11 }} />}
        onClick={() => onChange([...rows, { key: '', value: '' }])}
        sx={{ fontSize: 10, height: 24, borderRadius: '6px', color: 'text.disabled', borderColor: 'divider', '&:hover': { color: 'text.primary', borderColor: 'text.secondary' } }}>
        {addLabel}
      </Button>
    </Box>
  );
}

function ResponseMapRows({ rows, onChange }: { rows: ResponseMapRow[]; onChange: (rows: ResponseMapRow[]) => void }) {
  const update = (idx: number, patch: Partial<ResponseMapRow>) => onChange(rows.map((r, i) => i === idx ? { ...r, ...patch } : r));
  const remove = (idx: number) => onChange(rows.filter((_, i) => i !== idx));
  return (
    <Box display="flex" flexDirection="column" gap={0.75}>
      {rows.map((row, idx) => (
        <Box key={idx} display="flex" gap={0.5} alignItems="center">
          <TextField size="small" placeholder="Response field" value={row.key}
            onChange={e => update(idx, { key: e.target.value })}
            sx={{ flex: 1, ...fieldSx }} inputProps={{ style: { padding: '4px 8px', fontSize: 11 } }} />
          <TextField size="small" placeholder="context var name" value={row.value}
            onChange={e => update(idx, { value: e.target.value })}
            sx={{ flex: 1, ...monoSx }} inputProps={{ style: { padding: '4px 8px', fontSize: 11 } }} />
          <FormControl size="small" sx={{ minWidth: 76 }}>
            <Select value={row.type || 'string'} onChange={e => update(idx, { type: e.target.value })}
              sx={{ borderRadius: '6px', fontSize: 11, height: 30 }}>
              {RESPONSE_TYPES.map(t => <MenuItem key={t} value={t} sx={{ fontSize: 11 }}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton size="small" onClick={() => remove(idx)}
            sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
            <DeleteOutlineIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Box>
      ))}
      <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 11 }} />}
        onClick={() => onChange([...rows, { key: '', value: '', type: 'string' }])}
        sx={{ fontSize: 10, height: 24, borderRadius: '6px', color: 'text.disabled', borderColor: 'divider', '&:hover': { color: 'text.primary', borderColor: 'text.secondary' } }}>
        Add Mapping
      </Button>
    </Box>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between"
        onClick={() => setOpen(o => !o)}
        sx={{ cursor: 'pointer', py: 0.5, px: 0.5, borderRadius: '4px', '&:hover': { backgroundColor: 'action.hover' } }}>
        <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.disabled' }}>
          {title}
        </Typography>
        {open ? <ExpandLessIcon sx={{ fontSize: 13, color: 'text.disabled' }} /> : <ExpandMoreIcon sx={{ fontSize: 13, color: 'text.disabled' }} />}
      </Box>
      {open && <Box mt={0.75}>{children}</Box>}
    </Box>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.disabled', mb: 0.75 }}>
      {children}
    </Typography>
  );
}

//  Node icon

function NodeIcon({ type, color, isFailureEnd }: { type: string; color: string; isFailureEnd?: boolean }) {
  const s = { fontSize: 16, color } as const;
  if (type === 'start')             return <PlayCircleIcon sx={s} />;
  if (type === 'user_task')         return <PersonIcon sx={s} />;
  if (type === 'service_task')      return <HttpIcon sx={s} />;
  if (type === 'script_task')       return <CodeIcon sx={s} />;
  if (type === 'exclusive_gateway') return <AltRouteIcon sx={s} />;
  if (type === 'end')               return isFailureEnd ? <WarningAmberIcon sx={s} /> : <StopCircleIcon sx={s} />;
  return <CodeIcon sx={s} />;
}

//  Per-type node config bodies

//  Start 
function StartConfig({ inputs, onChangeInputs }: { inputs: WorkflowInput[]; onChangeInputs: (v: WorkflowInput[]) => void }) {
  const types: WorkflowInput['type'][] = ['string', 'number', 'boolean', 'object'];
  const update = (idx: number, patch: Partial<WorkflowInput>) => onChangeInputs(inputs.map((inp, i) => i === idx ? { ...inp, ...patch } : inp));
  const remove = (idx: number) => onChangeInputs(inputs.filter((_, i) => i !== idx));
  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <SectionLabel>Workflow Inputs</SectionLabel>
      {inputs.length === 0 && (
        <Typography sx={{ fontSize: 11, color: 'text.disabled', fontStyle: 'italic' }}>No inputs yet</Typography>
      )}
      {inputs.map((inp, idx) => (
        <Box key={idx} display="flex" gap={0.5} alignItems="center">
          <TextField size="small" placeholder="variable name" value={inp.name}
            onChange={e => update(idx, { name: e.target.value })}
            sx={{ flex: 1, ...fieldSx }} inputProps={{ style: { padding: '4px 8px', fontSize: 11 } }} />
          <FormControl size="small" sx={{ minWidth: 72 }}>
            <Select value={inp.type} onChange={e => update(idx, { type: e.target.value as WorkflowInput['type'] })}
              sx={{ borderRadius: '6px', fontSize: 11, height: 30 }}>
              {types.map(t => <MenuItem key={t} value={t} sx={{ fontSize: 11 }}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <IconButton size="small" onClick={() => remove(idx)} sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
            <DeleteOutlineIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Box>
      ))}
      <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 11 }} />}
        onClick={() => onChangeInputs([...inputs, { name: '', type: 'string', required: false }])}
        sx={{ fontSize: 10, height: 26, borderRadius: '6px', color: 'text.disabled', borderColor: 'divider', alignSelf: 'flex-start', '&:hover': { color: 'text.primary', borderColor: 'text.secondary' } }}>
        Add Input
      </Button>
    </Box>
  );
}

//  User Task 
function UserTaskConfig({ node, availableVars, onUpdateConfig }: {
  node: CanvasNode; availableVars: Set<string>; onUpdateConfig: (c: Record<string, unknown>) => void;
}) {
  const c = node.config;
  const set = (key: string, val: unknown) => onUpdateConfig({ ...c, [key]: val });
  const reqMap = (c.requestMap as KVRow[]) ?? [];
  const resMap = (c.responseMap as Array<{ label: string; type: string; defaultValue: string }>) ?? [];

  const updateResRow = (idx: number, patch: Record<string, string>) =>
    set('responseMap', resMap.map((r, i) => i === idx ? { ...r, ...patch } : r));
  const removeResRow = (idx: number) => set('responseMap', resMap.filter((_, i) => i !== idx));

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <CollapsibleSection title="Request Fields - What user sees" defaultOpen>
        <KeyValueRows
          rows={reqMap}
          onChange={rows => set('requestMap', rows)}
          keyPlaceholder="Field label"
          valuePlaceholder="context.varName"
          addLabel="Add Field"
          availableVars={availableVars}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Response Fields - What system collects" defaultOpen>
        <Box display="flex" flexDirection="column" gap={0.75}>
          {resMap.map((row, idx) => (
            <Box key={idx} display="flex" flexDirection="column" gap={0.5}
              sx={{ p: 0.75, borderRadius: '6px', border: '1px solid', borderColor: 'divider', backgroundColor: 'action.hover' }}>
              <Box display="flex" gap={0.5} alignItems="center">
                <TextField size="small" placeholder="field name" value={row.label}
                  onChange={e => updateResRow(idx, { label: e.target.value })}
                  sx={{ flex: 1, ...fieldSx }} inputProps={{ style: { padding: '3px 6px', fontSize: 11 } }} />
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select value={row.type || 'string'}
                    onChange={e => updateResRow(idx, { type: e.target.value })}
                    sx={{ borderRadius: '6px', fontSize: 11, height: 28 }}>
                    {['string', 'number', 'boolean'].map(t => (
                      <MenuItem key={t} value={t} sx={{ fontSize: 11 }}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton size="small" onClick={() => removeResRow(idx)}
                  sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
                  <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
              <Tooltip title="Default value pre-filled when the form is shown" placement="bottom-start">
                <TextField size="small" placeholder="default value (optional)" value={row.defaultValue || ''}
                  onChange={e => updateResRow(idx, { defaultValue: e.target.value })}
                  sx={{ ...fieldSx }} inputProps={{ style: { padding: '3px 6px', fontSize: 11 } }} />
              </Tooltip>
            </Box>
          ))}
          <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 11 }} />}
            onClick={() => set('responseMap', [...resMap, { label: '', type: 'string', defaultValue: '' }])}
            sx={{ fontSize: 10, height: 24, borderRadius: '6px', color: 'text.disabled', borderColor: 'divider', '&:hover': { color: 'text.primary', borderColor: 'text.secondary' } }}>
            Add Field
          </Button>
        </Box>
      </CollapsibleSection>
    </Box>
  );
}

//  Script Task 
function ScriptTaskConfig({ node, onUpdateConfig, onOpenCodeEditor }: {
  node: CanvasNode; onUpdateConfig: (c: Record<string, unknown>) => void; onOpenCodeEditor: () => void;
}) {
  const c = node.config;
  const set = (key: string, val: unknown) => onUpdateConfig({ ...c, [key]: val });
  const codeMode = (c.codeMode as string) || 'editor';
  const attachedFileName = c.attachedFileName as string | undefined;
  const fileCodeOriginal = c.fileCodeOriginal as string | undefined;
  const sourceCode = c.sourceCode as string | undefined;
  const isEdited = !!(attachedFileName && fileCodeOriginal !== undefined && sourceCode !== fileCodeOriginal);
  const scriptOutputs = (c.scriptOutputs as Array<{ name: string; type: string }>) ?? [];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      onUpdateConfig({
        ...c,
        codeMode: 'file',
        sourceCode: text,
        fileCodeOriginal: text,
        attachedFileName: file.name,
      });
    };
    reader.readAsText(file);
    // Reset input so re-selecting same file triggers onChange again
    e.target.value = '';
  };

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      {/* Mode toggle */}
      <Box display="flex" gap={0.5}>
        <Button
          size="small" fullWidth
          variant={codeMode === 'editor' ? 'contained' : 'outlined'}
          startIcon={<CodeIcon sx={{ fontSize: 13 }} />}
          onClick={() => set('codeMode', 'editor')}
          sx={{
            fontSize: 11, height: 30, borderRadius: '6px', fontWeight: codeMode === 'editor' ? 600 : 400,
            ...(codeMode === 'editor'
              ? { backgroundColor: 'rgba(79,110,247,0.15)', color: '#4f6ef7', border: '1px solid rgba(79,110,247,0.3)', boxShadow: 'none', '&:hover': { backgroundColor: 'rgba(79,110,247,0.25)', boxShadow: 'none' } }
              : { borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'text.secondary' } }),
          }}
        >
          Write Code
        </Button>
        <Button
          size="small" fullWidth
          variant={codeMode === 'file' ? 'contained' : 'outlined'}
          startIcon={<AttachFileIcon sx={{ fontSize: 13 }} />}
          onClick={() => set('codeMode', 'file')}
          sx={{
            fontSize: 11, height: 30, borderRadius: '6px', fontWeight: codeMode === 'file' ? 600 : 400,
            ...(codeMode === 'file'
              ? { backgroundColor: 'rgba(79,110,247,0.15)', color: '#4f6ef7', border: '1px solid rgba(79,110,247,0.3)', boxShadow: 'none', '&:hover': { backgroundColor: 'rgba(79,110,247,0.25)', boxShadow: 'none' } }
              : { borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'text.secondary' } }),
          }}
        >
          Attach File
        </Button>
      </Box>

      {/* Python badge */}
      <Box display="flex" alignItems="center" gap={0.75}>
        <Chip label="Python 3" size="small" sx={{
          fontSize: 10, height: 20, fontFamily: "'JetBrains Mono', monospace",
          backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6',
          border: '1px solid rgba(59,130,246,0.25)',
        }} />
      </Box>

      {/* Editor mode */}
      {codeMode === 'editor' && (
        <Button fullWidth variant="contained" startIcon={<CodeIcon sx={{ fontSize: 14 }} />}
          onClick={onOpenCodeEditor}
          sx={{
            fontSize: 12, height: 34, borderRadius: '8px', fontWeight: 600,
            backgroundColor: 'rgba(79,110,247,0.15)', color: '#4f6ef7',
            border: '1px solid rgba(79,110,247,0.3)',
            '&:hover': { backgroundColor: 'rgba(79,110,247,0.25)', boxShadow: 'none' },
            boxShadow: 'none',
          }}>
          Open Code Editor
        </Button>
      )}

      {/* File mode */}
      {codeMode === 'file' && (
        <Box display="flex" flexDirection="column" gap={1}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".py"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {attachedFileName ? (
            <Box>
              {/* Filename chip row */}
              <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap" mb={0.75}>
                <AttachFileIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Chip
                  label={attachedFileName}
                  size="small"
                  sx={{
                    fontSize: 10, height: 20,
                    fontFamily: "'JetBrains Mono', monospace",
                    backgroundColor: 'action.selected',
                    maxWidth: 140,
                    '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                  }}
                />
                {isEdited && (
                  <Tooltip title="Code was modified after attaching the file">
                    <Chip
                      icon={<EditIcon sx={{ fontSize: 10 }} />}
                      label="Edited"
                      size="small"
                      sx={{
                        fontSize: 9, height: 18,
                        backgroundColor: 'rgba(245,158,11,0.12)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245,158,11,0.3)',
                        '& .MuiChip-label': { px: 0.5 },
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
              <Box display="flex" gap={0.5}>
                <Button size="small" variant="outlined" fullWidth
                  startIcon={<CodeIcon sx={{ fontSize: 13 }} />}
                  onClick={onOpenCodeEditor}
                  sx={{ fontSize: 11, height: 28, borderRadius: '6px', borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'text.secondary' } }}>
                  Preview / Edit
                </Button>
                <Tooltip title="Replace with a different file">
                  <Button size="small" variant="outlined"
                    startIcon={<AttachFileIcon sx={{ fontSize: 13 }} />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ fontSize: 11, height: 28, borderRadius: '6px', borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'text.secondary' }, whiteSpace: 'nowrap' }}>
                    Replace
                  </Button>
                </Tooltip>
              </Box>
            </Box>
          ) : (
            <Button fullWidth variant="outlined"
              startIcon={<AttachFileIcon sx={{ fontSize: 14 }} />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                fontSize: 12, height: 34, borderRadius: '8px',
                borderColor: 'divider', color: 'text.secondary',
                borderStyle: 'dashed',
                '&:hover': { borderColor: 'text.secondary', borderStyle: 'dashed' },
              }}>
              Choose Python File
            </Button>
          )}
        </Box>
      )}

      {/* Declared Outputs */}
      <CollapsibleSection title="Declared Outputs">
        <Box display="flex" flexDirection="column" gap={0.75}>
          <Typography sx={{ fontSize: 10, color: 'text.disabled', lineHeight: 1.4, mb: 0.25 }}>
            Declare variables this script returns so downstream nodes can reference them as context variables.
          </Typography>
          {scriptOutputs.map((output, idx) => (
            <Box key={idx} display="flex" gap={0.5} alignItems="center">
              <TextField size="small" placeholder="variable name" value={output.name}
                onChange={e => {
                  const next = scriptOutputs.map((o, i) => i === idx ? { ...o, name: e.target.value } : o);
                  set('scriptOutputs', next);
                }}
                sx={{ flex: 1, ...fieldSx }} inputProps={{ style: { padding: '4px 8px', fontSize: 11 } }} />
              <FormControl size="small" sx={{ minWidth: 76 }}>
                <Select value={output.type || 'string'}
                  onChange={e => {
                    const next = scriptOutputs.map((o, i) => i === idx ? { ...o, type: e.target.value } : o);
                    set('scriptOutputs', next);
                  }}
                  sx={{ borderRadius: '6px', fontSize: 11, height: 30 }}>
                  {RESPONSE_TYPES.map(t => <MenuItem key={t} value={t} sx={{ fontSize: 11 }}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <IconButton size="small"
                onClick={() => set('scriptOutputs', scriptOutputs.filter((_, i) => i !== idx))}
                sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
                <DeleteOutlineIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
          ))}
          <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 11 }} />}
            onClick={() => set('scriptOutputs', [...scriptOutputs, { name: '', type: 'string' }])}
            sx={{ fontSize: 10, height: 24, borderRadius: '6px', color: 'text.disabled', borderColor: 'divider', alignSelf: 'flex-start', '&:hover': { color: 'text.primary', borderColor: 'text.secondary' } }}>
            Add Output
          </Button>
        </Box>
      </CollapsibleSection>
    </Box>
  );
}

//  Service Task 
function ServiceTaskConfig({ node, availableVars, onUpdateConfig }: {
  node: CanvasNode; availableVars: Set<string>; onUpdateConfig: (c: Record<string, unknown>) => void;
}) {
  const c = node.config;
  const set = (key: string, val: unknown) => onUpdateConfig({ ...c, [key]: val });
  const headers = (c.headers as KVRow[]) ?? [];
  const requestBody = (c.requestBody as KVRow[]) ?? [];
  const responseMap = (c.responseMap as ResponseMapRow[]) ?? [];

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      {/* Method + URL */}
      <Box>
        <SectionLabel>Endpoint</SectionLabel>
        <Box display="flex" gap={0.75} alignItems="flex-start">
          <FormControl size="small" sx={{ minWidth: 82, flexShrink: 0 }}>
            <Select value={(c.method as string) || 'GET'}
              onChange={e => set('method', e.target.value)}
              sx={{ borderRadius: '6px', fontSize: 11, height: 32 }}>
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                <MenuItem key={m} value={m} sx={{ fontSize: 11 }}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box flex={1} minWidth={0}>
            <TextField fullWidth size="small" placeholder="https://api.example.com/endpoint"
              value={(c.url as string) || ''}
              onChange={e => set('url', e.target.value)}
              sx={monoSx} inputProps={{ style: { padding: '6px 8px', fontSize: 11 } }} />
            <ContextVarChips text={(c.url as string) || ''} availableVars={availableVars} />
          </Box>
        </Box>
      </Box>

      {/* Max Attempts */}
      <Box display="flex" alignItems="center" gap={1}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', flexShrink: 0 }}>Max Attempts</Typography>
        <TextField size="small" type="number"
          value={(c.maxAttempts as number) ?? 1}
          onChange={e => set('maxAttempts', Math.max(1, parseInt(e.target.value) || 1))}
          inputProps={{ min: 1, style: { padding: '4px 8px', fontSize: 11, width: 44 } }}
          sx={{ width: 64, ...fieldSx }} />
      </Box>

      <CollapsibleSection title="Headers">
        <KeyValueRows rows={headers} onChange={rows => set('headers', rows)}
          keyPlaceholder="Header name" valuePlaceholder="Value" addLabel="Add Header" />
      </CollapsibleSection>

      <CollapsibleSection title="Request Body">
        <KeyValueRows rows={requestBody} onChange={rows => set('requestBody', rows)}
          keyPlaceholder="Key" valuePlaceholder="value or context.var" addLabel="Add Field"
          availableVars={availableVars} />
      </CollapsibleSection>

      <CollapsibleSection title="Response Map">
        <ResponseMapRows rows={responseMap} onChange={rows => set('responseMap', rows)} />
      </CollapsibleSection>
    </Box>
  );
}

//  Gateway 
const OPERATORS: Record<string, Array<{ value: string; label: string }>> = {
  string:  [{ value: '===', label: 'equals' }, { value: '!==', label: 'not equals' }, { value: '.includes', label: 'contains' }, { value: '.startsWith', label: 'starts with' }, { value: '.endsWith', label: 'ends with' }],
  number:  [{ value: '===', label: 'equals' }, { value: '!==', label: 'not equals' }, { value: '>', label: 'greater than' }, { value: '<', label: 'less than' }, { value: '>=', label: '>= (gte)' }, { value: '<=', label: '<= (lte)' }],
  boolean: [{ value: '=== true', label: 'is true' }, { value: '=== false', label: 'is false' }],
  object:  [{ value: '!== null', label: 'exists' }, { value: '=== null', label: 'is null' }],
};

function buildConditionStr(variable: string, operator: string, value: string, type: string): string {
  if (!variable) return '';
  if (type === 'boolean' || type === 'object') return `context.${variable} ${operator}`;
  if (operator.startsWith('.')) return `context.${variable}${operator}("${value}")`;
  if (type === 'string') return `context.${variable} ${operator} "${value}"`;
  return `context.${variable} ${operator} ${value}`;
}

interface GatewayBranch { label: string; variable: string; operator: string; value: string; condition: string; }

function GatewayConfig({ node, inputs, availableVars, edges, onUpdateConfig, onDeleteEdge, onUpdateEdge }: {
  node: CanvasNode; inputs: WorkflowInput[]; availableVars: Set<string>;
  edges: CanvasEdge[];
  onUpdateConfig: (c: Record<string, unknown>) => void;
  onDeleteEdge: (id: string) => void;
  onUpdateEdge: (id: string, updates: Partial<CanvasEdge>) => void;
}) {
  const c = node.config;
  const branches = (c.branches as GatewayBranch[]) ?? [];
  const setBranches = (b: GatewayBranch[]) => onUpdateConfig({ ...c, branches: b });

  const getVarType = (varName: string): string => inputs.find(i => i.name === varName)?.type ?? 'string';

  const updateBranch = (idx: number, patch: Partial<GatewayBranch>) => {
    const next = branches.map((b, i) => {
      if (i !== idx) return b;
      const updated = { ...b, ...patch };
      const type = getVarType(updated.variable);
      const ops = OPERATORS[type] ?? OPERATORS.string;
      const op = ops.find(o => o.value === updated.operator) ? updated.operator : ops[0].value;
      updated.operator = op;
      updated.condition = buildConditionStr(updated.variable, op, updated.value, type);
      return updated;
    });
    setBranches(next);
  };

  const addBranch = () => setBranches([...branches, { label: `Branch ${branches.length + 1}`, variable: '', operator: '===', value: '', condition: '' }]);
  const removeBranch = (idx: number) => {
    // Remove the edge connected to this branch port
    const branchEdge = edges.find(e => e.source === node.id && e.sourcePort === `branch_${idx}`);
    if (branchEdge) onDeleteEdge(branchEdge.id);
    // Re-index edges for branches after the deleted one
    edges
      .filter(e => e.source === node.id && e.sourcePort?.startsWith('branch_'))
      .forEach(e => {
        const n = parseInt(e.sourcePort.replace('branch_', ''), 10);
        if (n > idx) onUpdateEdge(e.id, { sourcePort: `branch_${n - 1}` });
      });
    setBranches(branches.filter((_, i) => i !== idx));
  };

  const allVarNames = [...availableVars].sort();

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <SectionLabel>Branches</SectionLabel>
      {branches.length === 0 && (
        <Typography sx={{ fontSize: 11, color: 'text.disabled', fontStyle: 'italic' }}>No branches yet</Typography>
      )}
      {branches.map((branch, idx) => {
        const varType = getVarType(branch.variable);
        const ops = OPERATORS[varType] ?? OPERATORS.string;
        return (
          <Box key={idx} sx={{ p: 1, borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)', backgroundColor: 'rgba(245,158,11,0.03)' }}>
            <Box display="flex" alignItems="center" gap={0.5} mb={1}>
              <TextField size="small" placeholder="Branch label" value={branch.label}
                onChange={e => updateBranch(idx, { label: e.target.value })}
                sx={{ flex: 1, ...fieldSx }} inputProps={{ style: { padding: '3px 6px', fontSize: 11 } }} />
              <IconButton size="small" onClick={() => removeBranch(idx)}
                sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
                <DeleteOutlineIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>

            {/* Variable picker */}
            <Box display="flex" gap={0.5} mb={0.75} flexWrap="wrap">
              <FormControl size="small" sx={{ flex: 1, minWidth: 100 }}>
                <Select displayEmpty value={branch.variable}
                  onChange={e => updateBranch(idx, { variable: e.target.value })}
                  sx={{ borderRadius: '6px', fontSize: 11, height: 28 }}
                  renderValue={v => v || <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>Variable</Typography>}>
                  {allVarNames.map(v => (
                    <MenuItem key={v} value={v} sx={{ fontSize: 11 }}>
                      {v}
                      <Typography component="span" sx={{ ml: 1, fontSize: 9, color: 'text.disabled', fontFamily: "'JetBrains Mono', monospace" }}>
                        {getVarType(v)}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select value={ops.some(o => o.value === branch.operator) ? branch.operator : ops[0]?.value ?? '==='}
                  onChange={e => updateBranch(idx, { operator: e.target.value })}
                  sx={{ borderRadius: '6px', fontSize: 11, height: 28 }}>
                  {ops.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: 11 }}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>

              {varType !== 'boolean' && varType !== 'object' && (
                <TextField size="small" placeholder="value" value={branch.value}
                  onChange={e => updateBranch(idx, { value: e.target.value })}
                  sx={{ flex: 1, minWidth: 80, ...fieldSx }} inputProps={{ style: { padding: '4px 6px', fontSize: 11 } }} />
              )}
            </Box>

            {/* Condition preview */}
            {branch.condition && (
              <Box sx={{ px: 0.75, py: 0.5, borderRadius: '4px', backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                <HighlightedText text={branch.condition} />
              </Box>
            )}
          </Box>
        );
      })}
      <Button size="small" variant="outlined" startIcon={<AddIcon sx={{ fontSize: 11 }} />}
        onClick={addBranch}
        sx={{ fontSize: 10, height: 26, borderRadius: '6px', color: 'text.disabled', borderColor: 'divider', alignSelf: 'flex-start', '&:hover': { color: 'text.primary', borderColor: 'text.secondary' } }}>
        Add Branch
      </Button>
    </Box>
  );
}

//  End 
function EndConfig({ node, onUpdateConfig }: { node: CanvasNode; onUpdateConfig: (c: Record<string, unknown>) => void }) {
  const isFailure = !!(node.config.failure as boolean);
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between"
      sx={{ p: 1.25, borderRadius: '8px', backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.primary' }}>Is Failure End</Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Marks this as a failure termination</Typography>
      </Box>
      <Switch size="small" checked={isFailure}
        onChange={e => onUpdateConfig({ ...node.config, failure: e.target.checked })}
        sx={{ '& .MuiSwitch-thumb': { backgroundColor: isFailure ? '#ef4444' : undefined } }} />
    </Box>
  );
}

//  ConfigPanel props & main component

interface ConfigPanelProps {
  selectedItem: SelectedItem | null;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  inputs: WorkflowInput[];
  onClose: () => void;
  onUpdateNode: (id: string, updates: Partial<CanvasNode>) => void;
  onUpdateEdge: (id: string, updates: Partial<CanvasEdge>) => void;
  onDeleteEdge: (id: string) => void;
  onChangeInputs: (inputs: WorkflowInput[]) => void;
  onOpenCodeEditor: () => void;
}

export default function ConfigPanel({
  selectedItem, nodes, edges, inputs,
  onClose, onUpdateNode, onUpdateEdge, onDeleteEdge, onChangeInputs, onOpenCodeEditor,
}: ConfigPanelProps) {
  if (!selectedItem) return null;

  //  Edge config 
  if (selectedItem.type === 'edge') {
    const edge = edges.find(e => e.id === selectedItem.id);
    if (!edge) return null;
    const srcNode = nodes.find(n => n.id === edge.source);
    const tgtNode = nodes.find(n => n.id === edge.target);
    const availableVars = getAvailableVars(edge.target, nodes, edges, inputs);

    return (
      <Box sx={{ width: 280, flexShrink: 0, borderLeft: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ px: 1.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>Edge Config</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.disabled', fontFamily: "'JetBrains Mono', monospace" }}>
              {srcNode?.label ?? edge.source} → {tgtNode?.label ?? edge.target}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.disabled', p: 0.25 }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto', flex: 1 }}>
          <Box>
            <TextField fullWidth label="Condition Expression" size="small"
              value={edge.condition || ''}
              onChange={e => onUpdateEdge(edge.id, { condition: e.target.value })}
              placeholder="context.amount > 1000"
              helperText="Expression evaluated against context"
              sx={monoSx} />
            <ContextVarChips text={edge.condition || ''} availableVars={availableVars} />
          </Box>

          <Box display="flex" alignItems="center" justifyContent="space-between"
            sx={{ p: 1.25, borderRadius: '8px', backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.primary' }}>Default Edge</Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Taken when no conditions match</Typography>
            </Box>
            <Switch size="small" checked={edge.isDefault} onChange={e => onUpdateEdge(edge.id, { isDefault: e.target.checked })} />
          </Box>

          <Box sx={{ p: 1, backgroundColor: 'rgba(79,110,247,0.06)', borderRadius: '6px', border: '1px solid rgba(79,110,247,0.15)' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#4f6ef7', mb: 0.5 }}>Examples</Typography>
            <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'text.secondary', whiteSpace: 'pre', lineHeight: 1.6 }}>
              {'context.amount > 1000\ncontext.status === "approved"\ncontext.role === "admin"'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Button fullWidth variant="outlined" color="error" size="small"
            startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
            onClick={() => { onDeleteEdge(edge.id); onClose(); }}
            sx={{ fontSize: 12, height: 32, borderRadius: '8px', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444', '&:hover': { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: '#ef4444' } }}>
            Delete Connection
          </Button>
        </Box>
      </Box>
    );
  }

  //  Node config 
  if (selectedItem.type !== 'node') return null;
  const node = nodes.find(n => n.id === selectedItem.id);
  if (!node) return null;

  const color = getEffectiveNodeColor(node);
  const isEnd = node.type === 'end';
  const isFailureEnd = isEnd && !!(node.config.failure as boolean);
  const availableVars = getAvailableVars(node.id, nodes, edges, inputs);

  return (
    <Box sx={{ width: 280, flexShrink: 0, borderLeft: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Panel header */}
      <Box sx={{ px: 1.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <NodeIcon type={node.type} color={color} isFailureEnd={isFailureEnd} />
        <TextField
          size="small" value={node.label}
          onChange={e => onUpdateNode(node.id, { label: e.target.value })}
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: 12, fontWeight: 600, '& fieldset': { borderColor: 'transparent' }, '&:hover fieldset': { borderColor: 'divider' }, '&.Mui-focused fieldset': { borderColor: color } }, '& .MuiInputBase-input': { padding: '4px 6px' } }}
        />
        <Chip label={getNodeTypeLabel(node.type)} size="small"
          sx={{ fontSize: 9, height: 18, fontFamily: "'JetBrains Mono', monospace", backgroundColor: `${color}18`, color, borderRadius: '4px', '& .MuiChip-label': { px: 0.75 } }} />
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.disabled', p: 0.25, flexShrink: 0 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 1.5, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {node.type === 'start' && (
          <StartConfig inputs={inputs} onChangeInputs={onChangeInputs} />
        )}
        {node.type === 'user_task' && (
          <UserTaskConfig node={node} availableVars={availableVars}
            onUpdateConfig={config => onUpdateNode(node.id, { config })} />
        )}
        {node.type === 'script_task' && (
          <ScriptTaskConfig
            node={node}
            onUpdateConfig={config => onUpdateNode(node.id, { config })}
            onOpenCodeEditor={onOpenCodeEditor}
          />
        )}
        {node.type === 'service_task' && (
          <ServiceTaskConfig node={node} availableVars={availableVars}
            onUpdateConfig={config => onUpdateNode(node.id, { config })} />
        )}
        {node.type === 'exclusive_gateway' && (
          <GatewayConfig node={node} inputs={inputs} availableVars={availableVars}
            edges={edges}
            onUpdateConfig={config => onUpdateNode(node.id, { config })}
            onDeleteEdge={onDeleteEdge}
            onUpdateEdge={onUpdateEdge} />
        )}
        {node.type === 'end' && (
          <EndConfig node={node} onUpdateConfig={config => onUpdateNode(node.id, { config })} />
        )}
      </Box>
    </Box>
  );
}
