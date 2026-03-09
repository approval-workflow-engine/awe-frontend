import { useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ExpressionInput from './ExpressionInput';
import ContextVariableSelector from './ContextVariableSelector';
import DataTypeSelect from './DataTypeSelect';
import JsonPathInput from './JsonPathInput';
import AddRowButton from './AddRowButton';
import type { AvailableCtxVar } from '../context';
import type { ContextVariable } from '../../builderTypes';
import { DataType } from '../../builderTypes';

export interface ResponseMapRow {
  jsonPath: string;
  type: string;
  contextVariable?: ContextVariable;
  validationExpression?: string;
}

interface Props {
  rows: ResponseMapRow[];
  onChange: (rows: ResponseMapRow[]) => void;
  availableContext: AvailableCtxVar[];
  hint?: string;
}

const EMPTY_CV: ContextVariable = { name: '', scope: 'global' };

export default function ResponseMapSection({ rows, onChange, availableContext, hint }: Props) {
  const update = (idx: number, patch: Partial<ResponseMapRow>) =>
    onChange(rows.map((r, i) => i === idx ? { ...r, ...patch } : r));
  const remove = (idx: number) => onChange(rows.filter((_, i) => i !== idx));
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggleExpand = (idx: number) => setExpanded(s => {
    const n = new Set(s);
    if (n.has(idx)) n.delete(idx); else n.add(idx);
    return n;
  });

  return (
    <Box display="flex" flexDirection="column" gap={0.75}>
      {hint && (
        <Typography sx={{ fontSize: 9, color: 'text.secondary', opacity: 0.8, mb: 0.25 }}>{hint}</Typography>
      )}
      {rows.map((row, idx) => (
        <Box key={idx} sx={{
          border: '1px solid', borderColor: 'divider', borderRadius: '6px', overflow: 'hidden',
          '& .delete-btn': { opacity: 0, transition: 'opacity 0.15s' },
          '&:hover .delete-btn': { opacity: 1 },
        }}>
          <Box display="flex" gap={0.5} alignItems="center" sx={{ px: 0.75, py: 0.5, backgroundColor: 'action.hover' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <JsonPathInput value={row.jsonPath} onChange={v => update(idx, { jsonPath: v })} placeholder="result.field" />
            </Box>
            <DataTypeSelect value={row.type || DataType.STRING} onChange={v => update(idx, { type: v })} />
            <Tooltip title={expanded.has(idx) ? 'Collapse' : 'Context variable & validation'}>
              <IconButton size="small" onClick={() => toggleExpand(idx)} sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
                <KeyboardArrowRightIcon sx={{ fontSize: 13, transform: expanded.has(idx) ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
              </IconButton>
            </Tooltip>
            <IconButton className="delete-btn" size="small" onClick={() => remove(idx)} sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
              <DeleteOutlineIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Box>
          {expanded.has(idx) && (
            <Box sx={{ px: 0.75, py: 0.75, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box>
                <Typography sx={{ fontSize: 9, color: 'text.secondary', mb: 0.25 }}>Store as</Typography>
                <ContextVariableSelector
                  value={row.contextVariable ?? EMPTY_CV}
                  onChange={v => update(idx, { contextVariable: v })}
                />
              </Box>
              <ExpressionInput
                label="Validation"
                value={row.validationExpression ?? ''}
                onChange={v => update(idx, { validationExpression: v })}
                placeholder="value !== null"
                availableContext={availableContext}
                hint="Must return true to accept the value"
              />
            </Box>
          )}
        </Box>
      ))}
      <AddRowButton label="Add Mapping" onClick={() => onChange([...rows, { jsonPath: '', type: DataType.STRING }])} />
    </Box>
  );
}
