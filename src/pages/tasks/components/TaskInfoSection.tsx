import type { ReactNode } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import type { BackendTaskDetail } from '../../../types';

function resolveExpression(expr: string, ctx: Record<string, unknown>): string {
  if (expr.startsWith('context.')) {
    const path = expr.slice('context.'.length).split('.');
    const val = path.reduce<unknown>((acc, key) => {
      if (acc == null || typeof acc !== 'object') return undefined;
      return (acc as Record<string, unknown>)[key];
    }, ctx);
    return val !== undefined && val !== null ? String(val) : '—';
  }
  return expr;
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box display="flex" alignItems="flex-start" gap={2} py={0.75}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', minWidth: 140, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box flex={1}>{value}</Box>
    </Box>
  );
}

interface Props {
  task: BackendTaskDetail;
}

export default function TaskInfoSection({ task }: Props) {
  const config = task.node_configuration;
  const ctx = task.instance_context ?? {};
  const hasDisplayData = config.requestMap && config.requestMap.length > 0;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <AssignmentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography fontWeight={700} fontSize={15}>
          {config.title || 'Task Details'}
        </Typography>
      </Box>

      {config.description && (
        <Typography fontSize={13} color="text.secondary" mb={2.5} sx={{ lineHeight: 1.6 }}>
          {config.description}
        </Typography>
      )}

      <Box sx={{ '& > *:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
        <InfoRow
          label="Workflow"
          value={<Typography fontSize={13}>{task.workflow_name}</Typography>}
        />
        <InfoRow
          label="Instance ID"
          value={
            <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
              {task.instance_id}
            </Typography>
          }
        />
        <InfoRow
          label="Created"
          value={
            <Typography fontSize={13}>
              {new Date(task.created_on).toLocaleString(undefined, {
                dateStyle: 'medium', timeStyle: 'short',
              })}
            </Typography>
          }
        />
        <InfoRow
          label="Status"
          value={
            <Chip
              label={task.status.replace(/_/g, ' ')}
              size="small"
              sx={{ textTransform: 'capitalize', height: 22, fontSize: 11 }}
            />
          }
        />
      </Box>

      {hasDisplayData && (
        <Box mt={2.5}>
          <Typography fontSize={12} fontWeight={700} color="text.secondary" mb={1.5} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Display Data
          </Typography>
          <Box
            sx={{
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            {config.requestMap.map((field, i) => (
              <Box
                key={i}
                display="flex"
                alignItems="flex-start"
                gap={2}
                px={2}
                py={1}
                sx={{
                  borderBottom: i < config.requestMap.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  backgroundColor: i % 2 === 0 ? 'transparent' : 'action.hover',
                }}
              >
                <Typography sx={{ fontSize: 12, color: 'text.secondary', minWidth: 140, flexShrink: 0, pt: 0.25 }}>
                  {field.label}
                </Typography>
                <Typography fontSize={13} sx={{ fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>
                  {resolveExpression(field.valueExpression, ctx)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
