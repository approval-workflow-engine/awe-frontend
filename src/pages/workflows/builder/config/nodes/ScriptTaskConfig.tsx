import { useRef } from 'react';
import {
  Box, Typography, IconButton, TextField, Button, Chip, Tooltip, Divider,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EditIcon from '@mui/icons-material/Edit';
import ExpressionInput from '../shared/ExpressionInput';
import NumberInput from '../shared/NumberInput';
import AddRowButton from '../shared/AddRowButton';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import ResponseMapSection, { type ResponseMapRow } from '../shared/ResponseMapSection';
import OnErrorSection from '../shared/OnErrorSection';
import type { AvailableCtxVar } from '../context';
import type { CanvasNode } from '../../builderTypes';

interface ParamRow {
  name: string;
  valueExpression: string;
}

interface Props {
  node: CanvasNode;
  availableContext: AvailableCtxVar[];
  onUpdateConfig: (c: Record<string, unknown>) => void;
  onOpenCodeEditor: () => void;
}

export default function ScriptTaskConfig({ node, availableContext, onUpdateConfig, onOpenCodeEditor }: Props) {
  const c = node.config;
  const set = (key: string, val: unknown) => onUpdateConfig({ ...c, [key]: val });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const paramMap: ParamRow[] = (c.parameterMap as ParamRow[]) ?? [];
  const codeMode = (c.codeMode as string) ?? 'editor';
  const hasFile = !!(c.attachedFileName);
  const fileEdited = c.sourceCode !== c.fileCodeOriginal && hasFile;

  const updateParam = (idx: number, patch: Partial<ParamRow>) =>
    set('parameterMap', paramMap.map((p, i) => i === idx ? { ...p, ...patch } : p));
  const removeParam = (idx: number) =>
    set('parameterMap', paramMap.filter((_, i) => i !== idx));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const code = ev.target?.result as string;
      onUpdateConfig({
        ...c,
        codeMode: 'file',
        attachedFileName: file.name,
        sourceCode: code,
        fileCodeOriginal: code,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    onUpdateConfig({
      ...c,
      codeMode: 'editor',
      attachedFileName: undefined,
      sourceCode: '',
      fileCodeOriginal: undefined,
    });
  };

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      {/* Runtime + mode */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        
        <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 500, color: 'text.secondary' }}>
          Python 3
        </Typography>
        <Box display="flex" gap={0.5}>
          <Button
            size="small"
            onClick={() => set('codeMode', 'editor')}
            startIcon={<EditIcon sx={{ fontSize: 12 }} />}
            sx={{
              fontSize: 10, height: 26, borderRadius: '6px', textTransform: 'none',
              ...(codeMode === 'editor'
                ? { backgroundColor: 'action.selected', color: 'text.primary', boxShadow: 'none' }
                : { borderColor: 'divider', color: 'text.secondary', border: '1px solid' }),
            }}
          >
            Write
          </Button>
          <Button
            size="small"
            onClick={() => set('codeMode', 'file')}
            startIcon={<AttachFileIcon sx={{ fontSize: 12 }} />}
            sx={{
              fontSize: 10, height: 26, borderRadius: '6px', textTransform: 'none',
              ...(codeMode === 'file'
                ? { backgroundColor: 'action.selected', color: 'text.primary', boxShadow: 'none' }
                : { borderColor: 'divider', color: 'text.secondary', border: '1px solid' }),
            }}
          >
            File
          </Button>
        </Box>
      </Box>

      {/* Entry function */}
      <TextField
        size="small" label="Entry Function"
        value={(c.entryFunctionName as string) ?? 'main'}
        onChange={e => set('entryFunctionName', e.target.value)}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: 11, '& fieldset': { borderColor: 'divider' } }, '& .MuiInputLabel-root': { fontSize: 11 } }}
        inputProps={{ style: { padding: '5px 8px', fontSize: 11 } }}
      />

      

      <Divider sx={{ borderColor: 'divider' }} />

      {/* Code editor mode */}
      {codeMode === 'editor' && (
        <Button
          size="small" variant="outlined" onClick={onOpenCodeEditor}
          sx={{
            fontSize: 11, borderRadius: '6px', textTransform: 'none', height: 32,
            borderColor: 'divider', color: 'text.secondary',
            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
          }}
        >
          Open Code Editor
        </Button>
      )}

      {/* File mode */}
      {codeMode === 'file' && (
        <Box display="flex" flexDirection="column" gap={0.75}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".py"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {!hasFile ? (
            <Button
              size="small" variant="outlined" onClick={() => fileInputRef.current?.click()}
              startIcon={<AttachFileIcon sx={{ fontSize: 13 }} />}
              sx={{
                fontSize: 11, borderRadius: '6px', textTransform: 'none', height: 32,
                borderStyle: 'dashed', borderColor: 'divider', color: 'text.secondary',
              }}
            >
              Choose Python File (.py)
            </Button>
          ) : (
            <Box sx={{
              border: '1px solid', borderColor: 'divider', borderRadius: '6px',
              p: 0.75, backgroundColor: 'action.hover', display: 'flex', flexDirection: 'column', gap: 0.5,
            }}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <AttachFileIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                <Typography sx={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.attachedFileName as string}
                </Typography>
                {fileEdited && (
                  <Tooltip title="File has been modified in the code editor">
                    <Chip label="Edited" size="small" sx={{ fontSize: 9, height: 18, backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }} />
                  </Tooltip>
                )}
              </Box>
              <Box display="flex" gap={0.5}>
                <Button size="small" onClick={onOpenCodeEditor}
                  sx={{ fontSize: 10, height: 24, borderRadius: '5px', textTransform: 'none', flex: 1, border: '1px solid', borderColor: 'divider', color: 'text.secondary' }}>
                  Preview / Edit
                </Button>
                <Button size="small" onClick={() => fileInputRef.current?.click()}
                  sx={{ fontSize: 10, height: 24, borderRadius: '5px', textTransform: 'none', flex: 1, border: '1px solid', borderColor: 'divider', color: 'text.secondary' }}>
                  Replace File
                </Button>
                <Button size="small" onClick={handleRemoveFile}
                  sx={{ fontSize: 10, height: 24, borderRadius: '5px', textTransform: 'none', border: '1px solid', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
                  Remove
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Parameter Map */}
      <CollapsibleSection title="Parameter Map" count={paramMap.length}>
        <Box display="flex" flexDirection="column" gap={0.75}>
          <Typography sx={{ fontSize: 9, color: 'text.secondary', opacity: 0.8, mb: 0.25 }}>
            Arguments passed to your entry function
          </Typography>
          {paramMap.map((p, idx) => (
            <Box key={idx} sx={{
              border: '1px solid', borderColor: 'divider', borderRadius: '6px',
              p: 0.75, backgroundColor: 'action.hover',
              '& .delete-btn': { opacity: 0, transition: 'opacity 0.15s' },
              '&:hover .delete-btn': { opacity: 1 },
            }}>
              <Box display="flex" gap={0.5} alignItems="center" mb={0.5}>
                <TextField
                  size="small" placeholder="Parameter name" value={p.name}
                  onChange={e => updateParam(idx, { name: e.target.value })}
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: 11, '& fieldset': { borderColor: 'divider' } } }}
                  inputProps={{ style: { padding: '4px 8px', fontSize: 11 } }}
                />
                <IconButton
                  className="delete-btn" size="small" onClick={() => removeParam(idx)}
                  sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
              <ExpressionInput
                value={p.valueExpression}
                onChange={v => updateParam(idx, { valueExpression: v })}
                placeholder="context.someValue"
                availableContext={availableContext}
              />
            </Box>
          ))}
          <AddRowButton
            label="Add Parameter"
            onClick={() => set('parameterMap', [...paramMap, { name: '', valueExpression: '' }])}
          />
        </Box>
      </CollapsibleSection>

      {/* Response Map */}
      <CollapsibleSection title="Response Map" count={(c.responseMap as ResponseMapRow[])?.length ?? 0}>
        <ResponseMapSection
          rows={(c.responseMap as ResponseMapRow[]) ?? []}
          onChange={v => set('responseMap', v)}
          availableContext={availableContext}
          hint="JSON path extracts values from the object returned by your function"
        />
      </CollapsibleSection>

      {/* On Error */}
      <CollapsibleSection title="On Error">
        <OnErrorSection
          value={c.onError ?? 'terminate'}
          onChange={v => set('onError', v)}
          availableContext={availableContext}
        />
      </CollapsibleSection>

      <Divider sx={{ borderColor: 'divider' }} />


      {/* Max Attempts */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Max Attempts</Typography>
        <Box sx={{ width: 100 }}>
          <NumberInput
            value={(c.maxAttempts as number) ?? 1}
            onChange={v => set('maxAttempts', v ?? 1)}
            min={1}
            allowEmpty={false}
          />
        </Box>
      </Box>
    </Box>
  );
}
