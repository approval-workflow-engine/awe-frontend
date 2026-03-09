import { useState, useRef } from 'react';
import {
  Box, Typography, IconButton, TextField, Switch, Tooltip,
  FormControl, Select, MenuItem, Divider,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ExpressionInput from '../shared/ExpressionInput';
import ContextVariableSelector from '../shared/ContextVariableSelector';
import DataTypeSelect from '../shared/DataTypeSelect';
import AddRowButton from '../shared/AddRowButton';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { getDefaultUiType } from '../bodyHelpers';
import { UI_TYPES } from '../constants';
import type { AvailableCtxVar } from '../context';
import type { CanvasNode, ContextVariable } from '../../builderTypes';
import { DataType, generateId } from '../../builderTypes';

interface ResponseMapRowUser {
  fieldId: string;
  label: string;
  default?: unknown;
  required?: boolean;
  contextVariable?: ContextVariable;
  type: string;
  uiType?: string;
  options?: Array<{ label?: string; valueExpression: string }>;
  validationExpression?: string;
}

interface Props {
  node: CanvasNode;
  availableContext: AvailableCtxVar[];
  onUpdateConfig: (c: Record<string, unknown>) => void;
}

const EMPTY_CV: ContextVariable = { name: '', scope: 'global' };

export default function UserTaskConfig({ node, availableContext, onUpdateConfig }: Props) {
  const c = node.config;
  const set = (key: string, val: unknown) => onUpdateConfig({ ...c, [key]: val });

  const reqMap: Array<{ label: string; valueExpression: string }> =
    (c.requestMap as Array<{ label: string; valueExpression: string }>) ?? [];
  const resMap: ResponseMapRowUser[] = (c.responseMap as ResponseMapRowUser[]) ?? [];

  const [expandedRes, setExpandedRes] = useState<Set<string>>(new Set());
  const toggleRes = (fieldId: string) => setExpandedRes(s => {
    const n = new Set(s);
    if (n.has(fieldId)) n.delete(fieldId); else n.add(fieldId);
    return n;
  });


  const manualUiTypeIds = useRef<Set<string>>(new Set());

  const updateReq = (idx: number, patch: Partial<{ label: string; valueExpression: string }>) =>
    set('requestMap', reqMap.map((r, i) => i === idx ? { ...r, ...patch } : r));
  const removeReq = (idx: number) => set('requestMap', reqMap.filter((_, i) => i !== idx));

  const updateRes = (idx: number, patch: Partial<ResponseMapRowUser>) =>
    set('responseMap', resMap.map((r, i) => i === idx ? { ...r, ...patch } : r));
  const removeRes = (idx: number) => {
    const row = resMap[idx];
    manualUiTypeIds.current.delete(row.fieldId);
    setExpandedRes(s => { const n = new Set(s); n.delete(row.fieldId); return n; });
    set('responseMap', resMap.filter((_, i) => i !== idx));
  };

  const handleResTypeChange = (idx: number, newType: DataType) => {
    const row = resMap[idx];
    const isManual = manualUiTypeIds.current.has(row.fieldId);
    updateRes(idx, { type: newType, ...(!isManual && { uiType: getDefaultUiType(newType) }) });
  };
  const handleResUiTypeChange = (idx: number, uiType: string) => {
    manualUiTypeIds.current.add(resMap[idx].fieldId);
    updateRes(idx, { uiType });
  };

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Box display="flex" flexDirection="column" gap={1}>
        <TextField size="small" label="Title" value={(c.title as string) ?? ''}
          onChange={e => set('title', e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: 11, '& fieldset': { borderColor: 'divider' } }, '& .MuiInputLabel-root': { fontSize: 11 } }}
          inputProps={{ style: { padding: '5px 8px', fontSize: 11 } }} />
        <TextField size="small" label="Description" value={(c.description as string) ?? ''}
          onChange={e => set('description', e.target.value)} multiline minRows={2}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: 11, '& fieldset': { borderColor: 'divider' } }, '& .MuiInputLabel-root': { fontSize: 11 } }} />
        <ExpressionInput
          label="Assignee (optional)"
          value={(c.assignee as string) ?? ''}
          onChange={v => set('assignee', v)}
          placeholder="context.assigneeEmail"
          availableContext={availableContext}
          hint="If left empty, the task will be unassigned and visible to all users"
        />
      </Box>

      <Divider sx={{ borderColor: 'divider' }} />

      <CollapsibleSection title="Display Data" count={reqMap.length}>
        <Box display="flex" flexDirection="column" gap={0.75}>
          <Typography sx={{ fontSize: 9, color: 'text.secondary', opacity: 0.8, mb: 0.25 }}>
            Data shown to the reviewer/approver
          </Typography>
          {reqMap.map((row, idx) => (
            <Box key={idx} sx={{
              border: '1px solid', borderColor: 'divider', borderRadius: '6px', p: 0.75, backgroundColor: 'action.hover',
              '& .delete-btn': { opacity: 0, transition: 'opacity 0.15s' }, '&:hover .delete-btn': { opacity: 1 },
            }}>
              <Box display="flex" gap={0.5} alignItems="center" mb={0.5}>
                <TextField size="small" placeholder="Label" value={row.label}
                  onChange={e => updateReq(idx, { label: e.target.value })}
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: 11, '& fieldset': { borderColor: 'divider' } } }}
                  inputProps={{ style: { padding: '4px 8px', fontSize: 11 } }} />
                <IconButton className="delete-btn" size="small" onClick={() => removeReq(idx)} sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
                  <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
              <ExpressionInput value={row.valueExpression} onChange={v => updateReq(idx, { valueExpression: v })}
                placeholder="context.value" availableContext={availableContext} />
            </Box>
          ))}
          <AddRowButton label="Add Field" onClick={() => set('requestMap', [...reqMap, { label: '', valueExpression: '' }])} />
        </Box>
      </CollapsibleSection>

      <CollapsibleSection title="Input Fields" count={resMap.length}>
        <Box display="flex" flexDirection="column" gap={0.75}>
          <Typography sx={{ fontSize: 9, color: 'text.secondary', opacity: 0.8, mb: 0.25 }}>
            Fields the reviewer/approver must fill in
          </Typography>
          {resMap.map((row, idx) => (
            <Box key={idx} sx={{
              border: '1px solid', borderColor: 'divider', borderRadius: '6px', overflow: 'hidden',
              '& .delete-btn': { opacity: 0, transition: 'opacity 0.15s' }, '&:hover .delete-btn': { opacity: 1 },
            }}>
              <Box sx={{ px: 0.75, py: 0.75, backgroundColor: 'action.hover' }}>
                <Box display="flex" gap={0.5} alignItems="center" mb={0.5}>
                  <TextField size="small" placeholder="Field label" value={row.label}
                    onChange={e => {
                      const slug = e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                      updateRes(idx, { label: e.target.value, fieldId: row.fieldId || slug || generateId('field') });
                    }}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: 11, '& fieldset': { borderColor: 'divider' } } }}
                    inputProps={{ style: { padding: '4px 8px', fontSize: 11 } }} />
                  <DataTypeSelect value={row.type || DataType.STRING} onChange={v => handleResTypeChange(idx, v)} exclude={[DataType.NULL]} />
                  <Tooltip title={expandedRes.has(row.fieldId) ? 'Collapse' : 'More options'}>
                    <IconButton size="small" onClick={() => toggleRes(row.fieldId)} sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
                      <KeyboardArrowRightIcon sx={{ fontSize: 13, transform: expandedRes.has(row.fieldId) ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                    </IconButton>
                  </Tooltip>
                  <IconButton className="delete-btn" size="small" onClick={() => removeRes(idx)} sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
                    <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
                <Box display="flex" gap={0.5} alignItems="center">
                  <Typography sx={{ fontSize: 9, color: 'text.disabled' }}>id:</Typography>
                  <Typography sx={{ fontSize: 9, color: 'text.secondary' }}>{row.fieldId || '-'}</Typography>
                </Box>
              </Box>
              {expandedRes.has(row.fieldId) && (
                <Box sx={{ px: 0.75, py: 0.75, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box display="flex" alignItems="center" gap={1} justifyContent="space-between">
                    <Box display="flex" gap={0.5} alignItems="center">
                      <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>UI Type</Typography>
                      <FormControl size="small" sx={{ minWidth: 90 }}>
                        <Select value={row.uiType ?? getDefaultUiType(row.type)} onChange={e => handleResUiTypeChange(idx, e.target.value)}
                          sx={{ borderRadius: '6px', fontSize: 11, height: 24 }}>
                          {UI_TYPES.map(t => <MenuItem key={t} value={t} sx={{ fontSize: 11 }}>{t}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Required</Typography>
                      <Switch size="small" checked={row.required ?? false} onChange={e => updateRes(idx, { required: e.target.checked })} />
                    </Box>
                  </Box>
                  {!row.required && (
                    <TextField size="small" label="Default" value={(row.default as string) ?? ''}
                      onChange={e => updateRes(idx, { default: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: 11, '& fieldset': { borderColor: 'divider' } }, '& .MuiInputLabel-root': { fontSize: 11 } }}
                      inputProps={{ style: { padding: '4px 8px', fontSize: 11 } }} />
                  )}
                  <Box>
                    <Typography sx={{ fontSize: 9, color: 'text.secondary', mb: 0.25 }}>Store as</Typography>
                    <ContextVariableSelector value={row.contextVariable ?? EMPTY_CV} onChange={v => updateRes(idx, { contextVariable: v })} />
                  </Box>
                  {row.uiType === 'dropdown' && (
                    <Box>
                      <Typography sx={{ fontSize: 9, color: 'text.secondary', mb: 0.5 }}>Options</Typography>
                      {(row.options ?? []).map((opt, oi) => (
                        <Box key={oi} display="flex" gap={0.5} alignItems="center" mb={0.5}>
                          <TextField size="small" placeholder="Label" value={opt.label ?? ''}
                            onChange={e => updateRes(idx, { options: (row.options ?? []).map((o, j) => j === oi ? { ...o, label: e.target.value } : o) })}
                            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: 11, '& fieldset': { borderColor: 'divider' } } }}
                            inputProps={{ style: { padding: '3px 6px', fontSize: 11 } }} />
                          <Box flex={1}>
                            <ExpressionInput
                              value={opt.valueExpression}
                              onChange={v => updateRes(idx, { options: (row.options ?? []).map((o, j) => j === oi ? { ...o, valueExpression: v } : o) })}
                              placeholder="context.option"
                              availableContext={availableContext}
                            />
                          </Box>
                          <IconButton size="small" onClick={() => updateRes(idx, { options: (row.options ?? []).filter((_, j) => j !== oi) })} sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
                            <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Box>
                      ))}
                      <AddRowButton label="Add Option" onClick={() => updateRes(idx, { options: [...(row.options ?? []), { valueExpression: '' }] })} />
                    </Box>
                  )}
                  <ExpressionInput
                    label="Validation"
                    value={row.validationExpression ?? ''}
                    onChange={v => updateRes(idx, { validationExpression: v })}
                    placeholder="value !== ''"
                    availableContext={availableContext}
                    hint="Must return true to accept the field value"
                  />
                </Box>
              )}
            </Box>
          ))}
          <AddRowButton
            label="Add Field"
            onClick={() => set('responseMap', [...resMap, { fieldId: generateId('field'), label: '', type: DataType.STRING, required: false }])}
          />
        </Box>
      </CollapsibleSection>
    </Box>
  );
}
