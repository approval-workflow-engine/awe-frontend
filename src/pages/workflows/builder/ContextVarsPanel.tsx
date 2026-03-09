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

  // Also collect context vars from start node's inputDataMap
  const startNode = nodes.find(n => n.type === 'start');
  const startInputVars: ContextVarEntry[] = [];
  if (startNode) {
    const idm = (startNode.config.inputDataMap as Array<{ contextVariable?: { name?: string }; type?: string; label?: string }>) ?? [];
    for (const row of idm) {
      const varName = row.contextVariable?.name;
      if (varName) startInputVars.push({ name: varName, type: row.type || 'string', source: 'Start' });
    }
  }

  const outputVars: ContextVarEntry[] = [];
  for (const node of nodes) {
    if (node.type === 'start' || node.type === 'end') continue;
    const rm = node.config.responseMap;

    // New schema: responseMap[] has contextVariable: { name, scope }
    if (Array.isArray(rm)) {
      for (const row of rm as Array<{ contextVariable?: { name?: string }; type?: string }>) {
        const varName = row.contextVariable?.name;
        if (varName) outputVars.push({ name: varName, type: row.type || 'string', source: node.label });
      }
    }

    // Legacy object format fallback - keys become var names
    if (rm && typeof rm === 'object' && !Array.isArray(rm)) {
      for (const key of Object.keys(rm as Record<string, unknown>)) {
        if (key) outputVars.push({ name: key, type: 'string', source: node.label });
      }
    }
  }

  // Prefer context var names from start node's inputDataMap; fall back to raw workflow inputs
  const displayInputVars = startInputVars.length > 0 ? startInputVars : inputVars;
  const hasAnything = displayInputVars.length > 0 || outputVars.length > 0;

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pt: 1.5, pb: 2 }}>
      <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', px: 0.5, mb: 1 }}>
        Context Vars
      </Typography>

      {!hasAnything && (
        <Typography sx={{ fontSize: 10, color: 'text.secondary', px: 0.5, fontStyle: 'italic' }}>
          No variables yet
        </Typography>
      )}

      {displayInputVars.length > 0 && (
        <Box mb={1}>
          <Typography sx={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', px: 0.5, mb: 0.5 }}>
            Inputs
          </Typography>
          <Box display="flex" flexDirection="column" gap={0.5}>
            {displayInputVars.map((v, i) => (
              <VarRow key={i} entry={v} isInput />
            ))}
          </Box>
        </Box>
      )}

      {outputVars.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', px: 0.5, mb: 0.5 }}>
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
