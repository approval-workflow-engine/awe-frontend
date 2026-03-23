import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails, Chip } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import type { ExecutionLog } from '../../../types';

const MONO = "'JetBrains Mono', monospace";

interface Props {
  logs?: ExecutionLog[];
  loading?: boolean;
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircleIcon sx={{ fontSize: 16, color: '#22c55e' }} />;
    case 'failed':
    case 'terminated':
      return <ErrorIcon sx={{ fontSize: 16, color: '#ef4444' }} />;
    case 'in_progress':
      return <HourglassEmptyIcon sx={{ fontSize: 16, color: '#06b6d4' }} />;
    default:
      return null;
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return '#22c55e';
    case 'failed':
    case 'terminated':
      return '#ef4444';
    case 'in_progress':
      return '#06b6d4';
    default:
      return '#6b7280';
  }
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '—';
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const durationMs = endTime - startTime;

  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(2)}s`;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = ((durationMs % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

function JsonDisplay({ title, data }: { title: string; data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) return null;

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
        {title}
      </Typography>
      <Box
        component="pre"
        sx={{
          fontFamily: MONO,
          fontSize: 11,
          m: 0,
          p: 1.5,
          borderRadius: 1,
          backgroundColor: 'action.hover',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: 300,
          overflowY: 'auto',
        }}
      >
        {JSON.stringify(data, null, 2)}
      </Box>
    </Box>
  );
}

export default function ExecutionDetails({ logs, loading }: Props) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TimelineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography fontWeight={700} fontSize={15}>
          Execution Timeline
        </Typography>
        {logs && logs.length > 0 && (
          <Chip
            label={`${logs.length} step${logs.length === 1 ? '' : 's'}`}
            size="small"
            sx={{ ml: 1, height: 20, fontSize: 11 }}
          />
        )}
      </Box>

      {loading && (
        <Box
          sx={{
            py: 6,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary" fontSize={13}>
            Loading execution logs...
          </Typography>
        </Box>
      )}

      {!loading && (!logs || logs.length === 0) && (
        <Box
          sx={{
            py: 6,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary" fontSize={13}>
            No execution history available.
          </Typography>
        </Box>
      )}

      {!loading && logs && logs.length > 0 && (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {logs.map((log, i) => (
            <Accordion
              key={log.id}
              disableGutters
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                backgroundColor: 'background.paper',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                sx={{
                  minHeight: 48,
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 2,
                    my: 1,
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={2} flex={1}>
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: 11,
                      color: 'text.secondary',
                      minWidth: 24,
                      textAlign: 'center',
                    }}
                  >
                    {i + 1}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(log.status)}
                    <Typography
                      sx={{
                        fontFamily: MONO,
                        fontSize: 11,
                        fontWeight: 600,
                        color: getStatusColor(log.status),
                        textTransform: 'uppercase',
                        minWidth: 90,
                      }}
                    >
                      {log.status}
                    </Typography>
                  </Box>

                  <Box flex={1}>
                    <Typography fontSize={13} fontWeight={600}>
                      {log.node_name || `${log.node_type} Node`}
                    </Typography>
                    <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: MONO }}>
                      {log.node_type} • {log.node_client_id}
                    </Typography>
                  </Box>

                  <Box textAlign="right">
                    <Typography fontSize={11} color="text.secondary">
                      {formatDuration(log.started_on, log.ended_on)}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ pt: 0, pb: 2, px: 2 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: 1.5,
                    py: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                    Node ID:
                  </Typography>
                  <Typography fontSize={12} sx={{ fontFamily: MONO }}>
                    {log.node_id}
                  </Typography>

                  <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                    Started:
                  </Typography>
                  <Typography fontSize={12}>
                    {formatTimestamp(log.started_on)}
                  </Typography>

                  {log.ended_on && (
                    <>
                      <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                        Ended:
                      </Typography>
                      <Typography fontSize={12}>
                        {formatTimestamp(log.ended_on)}
                      </Typography>
                    </>
                  )}

                  <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                    Duration:
                  </Typography>
                  <Typography fontSize={12} sx={{ fontFamily: MONO }}>
                    {formatDuration(log.started_on, log.ended_on)}
                  </Typography>
                </Box>

                <JsonDisplay title="Input Variables" data={log.input_variables} />
                <JsonDisplay title="Output Variables" data={log.output_variables} />
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Paper>
  );
}
