import type { ReactNode } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import StatusChip from '../../../components/common/StatusChip';
import type { BackendTaskDetail } from '../../../types';

const MONO = "'JetBrains Mono', monospace";

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box
      display="flex"
      alignItems="flex-start"
      gap={2}
      py={0.875}
      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Typography sx={{ fontSize: 12, color: 'text.secondary', minWidth: 120, flexShrink: 0, pt: 0.125 }}>
        {label}
      </Typography>
      <Box flex={1}>{value}</Box>
    </Box>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

interface Props {
  task: BackendTaskDetail;
}

export default function TaskInfoSection({ task }: Props) {
  const config = task.node_configuration;
  const hasDisplayData = config.requestMap && config.requestMap.length > 0;

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      {config.description && (
        <Typography
          fontSize={13}
          color="text.secondary"
          mb={2}
          sx={{ lineHeight: 1.65, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}
        >
          {config.description}
        </Typography>
      )}

      <Box>
        <InfoRow
          label="Workflow"
          value={<Typography fontSize={13}>{task.workflow_name}</Typography>}
        />
        <InfoRow
          label="Instance"
          value={
            <Typography sx={{ fontFamily: MONO, fontSize: 12 }}>
              {task.instance_id}
            </Typography>
          }
        />
        <InfoRow
          label="Status"
          value={<StatusChip status={task.status} />}
        />
        <InfoRow
          label="Created"
          value={
            <Typography fontSize={13}>
              {new Date(task.created_on).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </Typography>
          }
        />
        {config.assignee && (
          <InfoRow
            label="Assignee"
            value={<Typography fontSize={13}>{config.assignee}</Typography>}
          />
        )}
      </Box>

      {hasDisplayData && (
        <Box mt={2.5}>
          <Typography
            fontSize={11}
            fontWeight={700}
            color="text.secondary"
            mb={1.25}
            sx={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}
          >
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
                  px={1.75}
                  py={0.875}
                  sx={{
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'action.hover',
                    borderBottom: i < config.requestMap.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    sx={{ fontSize: 12, color: 'text.secondary', minWidth: 120, flexShrink: 0, pt: 0.25 }}
                  >
                    {field.label}
                  </Typography>
                  <Typography fontSize={13} sx={{ fontFamily: MONO, wordBreak: 'break-all' }}>
                    {formatValue(field.value)}
                  </Typography>
                </Box>
              ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
