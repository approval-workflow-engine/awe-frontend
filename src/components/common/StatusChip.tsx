import { Box, Typography } from '@mui/material';

export type ChipStatus =
  | 'active' | 'inactive' | 'deprecated'
  | 'draft' | 'published'
  | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'TERMINATED'
  | string;

interface StatusDef {
  color: string;
  label: string;
  pulse?: boolean;
}

const STATUS_MAP: Record<string, StatusDef> = {
  // Workflow status
  active:     { color: '#22c55e', label: 'Active' },
  inactive:   { color: '#8b91a8', label: 'Inactive' },
  deprecated: { color: '#f59e0b', label: 'Deprecated' },

  // Version status
  draft:      { color: '#a855f7', label: 'Draft' },
  valid:      { color: '#06b6d4', label: 'Valid' },
  published:  { color: '#f59e0b', label: 'Committed' },

  // Instance / Task status
  IN_PROGRESS: { color: '#06b6d4', label: 'In Progress', pulse: true },
  PAUSED:      { color: '#f59e0b', label: 'Paused' },
  COMPLETED:   { color: '#22c55e', label: 'Completed' },
  FAILED:      { color: '#ef4444', label: 'Failed' },
  TERMINATED:  { color: '#8b91a8', label: 'Terminated' },
};

function getStatusDef(status: string): StatusDef {
  const key = status?.toUpperCase?.() === status ? status : status?.toLowerCase?.();
  return (
    STATUS_MAP[status] ||
    STATUS_MAP[key] ||
    { color: '#8b91a8', label: status || 'Unknown' }
  );
}

interface StatusChipProps {
  status: ChipStatus;
  label?: string;
}

export default function StatusChip({ status, label }: StatusChipProps) {
  const def = getStatusDef(status);
  const displayLabel = label || def.label;

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
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: def.color,
          flexShrink: 0,
          ...(def.pulse
            ? {
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.4 },
                },
                animation: 'pulse 1.8s ease-in-out infinite',
              }
            : {}),
        }}
      />
      <Typography
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          fontWeight: 600,
          color: def.color,
          lineHeight: 1,
        }}
      >
        {displayLabel}
      </Typography>
    </Box>
  );
}
