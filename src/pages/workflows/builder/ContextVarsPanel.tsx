import { Box, Typography, Chip } from '@mui/material';
import { type CanvasNode, type WorkflowInput } from './builderTypes';

interface ContextVarEntry {
  name: string;
  type: string;
  source: string;
}

interface ContextVarsPanelProps {
  nodes: CanvasNode[];
  inputs: WorkflowInput[];
}

export default function ContextVarsPanel({ nodes, inputs }: ContextVarsPanelProps) {
  const inputVars: ContextVarEntry[] = inputs.map(i => ({
    name: i.name,
    type: i.type,
    source: 'Input',
  }));

  const outputVars: ContextVarEntry[] = [];
  for (const node of nodes) {
    if (node.type === 'start') continue;
    const rm = node.config.responseMap;

    // Object format - keys become var names
    if (rm && typeof rm === 'object' && !Array.isArray(rm)) {
      for (const key of Object.keys(rm as Record<string, unknown>)) {
        if (key) outputVars.push({ name: key, type: 'string', source: node.label });
      }
    }

    // Array format - user_task uses {label, type}, service_task uses {key, value, type} where value = context var name
    if (Array.isArray(rm)) {
      for (const row of rm as Array<{ label?: string; value?: string; type?: string }>) {
        const varName = row.label || row.value;
        if (varName) outputVars.push({ name: varName, type: row.type || 'string', source: node.label });
      }
    }

    // Script task declared outputs
    if (node.type === 'script_task') {
      const outputs = (node.config.scriptOutputs as Array<{ name: string; type?: string }>) ?? [];
      for (const o of outputs) {
        if (o.name) outputVars.push({ name: o.name, type: o.type || 'string', source: node.label });
      }
    }
  }

  const hasAnything = inputVars.length > 0 || outputVars.length > 0;

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pt: 1.5, pb: 2 }}>
      <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', px: 0.5, mb: 1 }}>
        Context Vars
      </Typography>

      {!hasAnything && (
        <Typography sx={{ fontSize: 10, color: 'text.disabled', px: 0.5, fontStyle: 'italic' }}>
          No variables yet
        </Typography>
      )}

      {inputVars.length > 0 && (
        <Box mb={1}>
          <Typography sx={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.disabled', px: 0.5, mb: 0.5 }}>
            Inputs
          </Typography>
          <Box display="flex" flexDirection="column" gap={0.5}>
            {inputVars.map((v, i) => (
              <VarRow key={i} entry={v} isInput />
            ))}
          </Box>
        </Box>
      )}

      {outputVars.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.disabled', px: 0.5, mb: 0.5 }}>
            Node Outputs
          </Typography>
          <Box display="flex" flexDirection="column" gap={0.5}>
            {outputVars.map((v, i) => (
              <VarRow key={i} entry={v} isInput={false} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function VarRow({ entry, isInput }: { entry: ContextVarEntry; isInput: boolean }) {
  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 0.5,
        px: 0.75, py: 0.5, borderRadius: '6px',
        backgroundColor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        backgroundColor: isInput ? '#4f6ef7' : '#8b91a8',
      }} />
      <Typography sx={{
        fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
        color: 'text.primary', flex: 1, minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {entry.name}
      </Typography>
      <Chip
        label={entry.type}
        size="small"
        sx={{
          fontSize: 8, height: 14, flexShrink: 0,
          backgroundColor: isInput ? 'rgba(79,110,247,0.12)' : 'rgba(139,145,168,0.12)',
          color: isInput ? '#4f6ef7' : '#8b91a8',
          border: `1px solid ${isInput ? 'rgba(79,110,247,0.25)' : 'rgba(139,145,168,0.25)'}`,
          '& .MuiChip-label': { px: 0.5 },
        }}
      />
    </Box>
  );
}
