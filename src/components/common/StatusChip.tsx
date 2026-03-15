import { Box, Typography } from '@mui/material';

export type ChipStatus =
  | 'active' | 'inactive' | 'deprecated'
  | 'draft' | 'published' | 'valid'
  | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'TERMINATED'
  | 'in_progress' | 'paused' | 'completed' | 'failed' | 'terminated'
  | string;

interface StatusDef {
  color: string;
  label: string;
  pulse?: boolean;
}

const STATUS_MAP: Record<string, StatusDef> = {
  active: { color: '#22c55e', label: 'Active' },
  inactive: { color: '#8b91a8', label: 'Inactive' },
  deprecated: { color: '#f59e0b', label: 'Deprecated' },

  draft: { color: '#a855f7', label: 'Draft' },
  valid: { color: '#06b6d4', label: 'Valid' },
  published: { color: '#f59e0b', label: 'Committed' },

  IN_PROGRESS: { color: '#06b6d4', label: 'In Progress', pulse: true },
  PAUSED:      { color: '#f59e0b', label: 'Paused' },
  COMPLETED:   { color: '#22c55e', label: 'Completed' },
  FAILED:      { color: '#ef4444', label: 'Failed' },
  TERMINATED:  { color: '#8b91a8', label: 'Terminated' },

  in_progress: { color: '#06b6d4', label: 'In Progress', pulse: true },
  paused:      { color: '#f59e0b', label: 'Paused' },
  completed:   { color: '#22c55e', label: 'Completed' },
  failed:      { color: '#ef4444', label: 'Failed' },
  terminated:  { color: '#8b91a8', label: 'Terminated' },
};

const getStatusDef = (status: string): StatusDef =>
  STATUS_MAP[status] ?? { color: '#8b91a8', label: status || 'Unknown' };

export default function StatusChip({ status, label }: { status: ChipStatus; label?: string }) {
  const def = getStatusDef(status);
  const text = label || def.label;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1,
        py: 0.25,
        borderRadius: '99px',
        backgroundColor: `${def.color}1a`,
        border: `1px solid ${def.color}33`,
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: def.color,
          ...(def.pulse && {
            animation: 'pulse 1.8s ease-in-out infinite',
            '@keyframes pulse': {
              '0%,100%': { opacity: 1 },
              '50%': { opacity: 0.4 },
            },
          }),
        }}
      />
      <Typography
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          fontWeight: 600,
          color: def.color,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}
