import { useState } from 'react';
import { Box, Typography, IconButton, TextField, Switch, Tooltip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ExpressionInput from '../shared/ExpressionInput';
import ContextVariableSelector from '../shared/ContextVariableSelector';
import AddRowButton from '../shared/AddRowButton';
import { SectionLabel } from '../shared/CollapsibleSection';
import type { AvailableCtxVar } from '../context';
import type { CanvasNode, ContextVariable } from '../../builderTypes';

interface ResultMapRow {
  contextVariable: ContextVariable;
  valueExpression: string;
  validationExpression?: string;
}

interface Props {
  node: CanvasNode;
  onUpdateConfig: (c: Record<string, unknown>) => void;
  availableContext: AvailableCtxVar[];
}

const EMPTY_CV: ContextVariable = { name: '', scope: 'global' };

export default function EndConfig({ node, onUpdateConfig, availableContext }: Props) {
  const c = node.config;
  const isSuccess = c.success !== false;
  const resultMap: ResultMapRow[] = (c.resultMap as ResultMapRow[]) ?? [];
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpand = (idx: number) => setExpanded(s => {
    const n = new Set(s);
    if (n.has(idx)) n.delete(idx); else n.add(idx);
    return n;
  });

  const set = (key: string, val: unknown) => onUpdateConfig({ ...c, [key]: val });
  const updateRow = (idx: number, patch: Partial<ResultMapRow>) =>
    set('resultMap', resultMap.map((r, i) => i === idx ? { ...r, ...patch } : r));
  const removeRow = (idx: number) => {
    setExpanded(s => {
      const n = new Set<number>();
      s.forEach(i => { if (i < idx) n.add(i); else if (i > idx) n.add(i - 1); });
      return n;
    });
    set('resultMap', resultMap.filter((_, i) => i !== idx));
  };


  const endCtx = availableContext.filter(v => v.scope !== 'next');

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>

      <Box sx={{
        p: 1.25, borderRadius: '8px', border: '1px solid',
        borderColor: isSuccess ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
        backgroundColor: isSuccess ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.2s',
      }}>
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: isSuccess ? '#22c55e' : '#ef4444' }}>
            {isSuccess ? 'Success End' : 'Failure End'}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
            {isSuccess ? 'Workflow completes successfully' : 'Workflow terminates as failed'}
          </Typography>
        </Box>
        <Switch
          size="small"
          checked={isSuccess}
          onChange={e => set('success', e.target.checked)}
          sx={{ '& .MuiSwitch-track': { backgroundColor: isSuccess ? '#22c55e' : '#ef4444' } }}
        />
      </Box>

      <Box>
        <SectionLabel>End Message</SectionLabel>
        <TextField
          fullWidth size="small" placeholder="Optional completion message"
          value={(c.message as string) ?? ''}
          onChange={e => set('message', e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: 11, '& fieldset': { borderColor: 'divider' } } }}
          inputProps={{ style: { padding: '5px 8px', fontSize: 11 } }}
        />
      </Box>

      <Box>
        <SectionLabel>Result Map</SectionLabel>
        <Box display="flex" flexDirection="column" gap={0.75}>
          {resultMap.map((row, idx) => (
            <Box key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', overflow: 'hidden' }}>
              <Box sx={{ px: 0.75, py: 0.75, backgroundColor: 'action.hover', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box flex={1}>
                    <Typography sx={{ fontSize: 9, color: 'text.secondary', mb: 0.25 }}>Context Variable</Typography>
                    <ContextVariableSelector
                      value={row.contextVariable ?? EMPTY_CV}
                      onChange={v => updateRow(idx, { contextVariable: { ...v, scope: 'global' } })}
                      hideNext
                    />
                  </Box>
                  <Tooltip title={expanded.has(idx) ? 'Collapse' : 'Validation expression'}>
                    <IconButton size="small" onClick={() => toggleExpand(idx)} sx={{ p: 0.25, mt: 2.5, color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
                      <KeyboardArrowRightIcon sx={{ fontSize: 13, transform: expanded.has(idx) ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" onClick={() => removeRow(idx)} sx={{ p: 0.25, mt: 2.5, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
                    <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
                <ExpressionInput
                  label="Value Expression"
                  value={row.valueExpression}
                  onChange={v => updateRow(idx, { valueExpression: v })}
                  placeholder="context.result"
                  availableContext={endCtx}
                />
              </Box>
              {expanded.has(idx) && (
                <Box sx={{ px: 0.75, py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
                  <ExpressionInput
                    label="Validation"
                    value={row.validationExpression ?? ''}
                    onChange={v => updateRow(idx, { validationExpression: v })}
                    placeholder="value !== null"
                    availableContext={endCtx}
                    hint="Must return true for the output to be accepted"
                  />
                </Box>
              )}
            </Box>
          ))}
          <AddRowButton
            label="Add Output"
            onClick={() => set('resultMap', [...resultMap, { contextVariable: EMPTY_CV, valueExpression: '' }])}
          />
        </Box>
      </Box>
    </Box>
  );
}
