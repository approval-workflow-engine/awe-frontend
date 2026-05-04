import type { ReactNode } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useMemo, memo } from 'react';
import StatusChip from '../../../components/common/StatusChip';
import type { UserTaskDetail } from '../../../api/schemas/task';
import { formatValue, formatDate } from '../../../utils/formatUtils';
import { UI_TEXT } from '../../../constants/status';

const MONO = "'JetBrains Mono', monospace";

const InfoRow = memo(function InfoRow({ label, value }: { label: string; value: ReactNode }) {
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
});

const DisplayFieldRow = memo(function DisplayFieldRow({
  field,
  index,
  total
}: {
  field: { label: string; value: unknown };
  index: number;
  total: number;
}) {
  return (
    <Box
      display="flex"
      alignItems="flex-start"
      gap={2}
      px={1.75}
      py={0.875}
      sx={{
        backgroundColor: index % 2 === 0 ? 'transparent' : 'action.hover',
        borderBottom: index < total - 1 ? '1px solid' : 'none',
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
  );
});

interface Props {
  task: UserTaskDetail;
}

export default function TaskInfoSection({ task }: Props) {
  const displayRows = useMemo((): Array<{ label: string; value: unknown }> =>
    task.requestData
      ? Object.entries(task.requestData).map(([label, value]) => ({ label, value }))
      : []
  , [task.requestData]);

  const formattedStartDate = useMemo(() =>
    formatDate((task.startedAt) as string | Date ?? '')
  , [task.startedAt]);

  const hasDisplayData = displayRows.length > 0;

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Box>
        <InfoRow
          label="Instance ID"
          value={<Typography fontSize={13} sx={{ fontFamily: MONO }}>{task.instanceId}</Typography>}
        />
        <InfoRow
          label={UI_TEXT.TASK_ID}
          value={
            <Typography sx={{ fontFamily: MONO, fontSize: 12 }}>
              {task.id}
            </Typography>
          }
        />
        <InfoRow
          label={UI_TEXT.TASK_STATUS}
          value={<StatusChip status={task.status} />}
        />
        <InfoRow
          label={UI_TEXT.STARTED}
          value={
            <Typography fontSize={13}>
              {formattedStartDate}
            </Typography>
          }
        />
        {task.assignee && (
          <InfoRow
            label={UI_TEXT.ASSIGNEE}
            value={<Typography fontSize={13}>{task.assignee}</Typography>}
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
            {UI_TEXT.DISPLAY_DATA}
          </Typography>
          <Box
            sx={{
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            {displayRows.map((field, i) => (
              <DisplayFieldRow
                key={`${field.label}-${i}`}
                field={field}
                index={i}
                total={displayRows.length}
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
