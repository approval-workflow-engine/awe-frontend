import { Box, Typography, Paper } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import type { ExecutionLog } from '../../../types';

interface Props {
  logs?: ExecutionLog[];
}

export default function ExecutionDetails({ logs }: Props) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TimelineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography fontWeight={700} fontSize={15}>
          Execution Details
        </Typography>
      </Box>

      {!logs || logs.length === 0 ? (
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
      ) : (
        <Box display="flex" flexDirection="column" gap={1}>
          {logs.map((log, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2,
                py: 1.25,
                borderRadius: 1,
                backgroundColor: 'action.hover',
              }}
            >
              <Typography
                sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'text.secondary', minWidth: 24 }}
              >
                {i + 1}
              </Typography>
              <Typography fontSize={13} flex={1}>
                {log.nodeId ?? log.node_id ?? '—'}
              </Typography>
              <Typography fontSize={12} color="text.secondary">
                {log.nodeType ?? log.type ?? '—'}
              </Typography>
              <Box>
                <Typography
                  sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 600,
                    color:
                      log.status === 'completed'
                        ? '#22c55e'
                        : log.status === 'failed'
                        ? '#ef4444'
                        : '#06b6d4',
                  }}
                >
                  {log.status}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
