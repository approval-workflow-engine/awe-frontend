import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
  Skeleton,
  Tooltip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import DetailInfoSection from './components/DetailInfoSection';
import ExecutionDetails from './components/ExecutionDetails';
import { useInstance } from './hooks/useInstance';

const MONO = "'JetBrains Mono', monospace";

export default function InstanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { instance, loading, fetch, resume } = useInstance();

  useEffect(() => {
    if (id) fetch(id);
  }, [id, fetch]);

  const canResume =
    instance?.auto_advance === false && instance?.status === 'paused';

  const handleResume = async () => {
    if (!id) return;
    await resume(id);
    await fetch(id);
  };

  const workflowLabel = instance
    ? instance.workflow_name
      ? `${instance.workflow_name}${instance.version_number != null ? ` · v${instance.version_number}` : ''}`
      : `Version: ${instance.workflow_version_id.slice(-12)}`
    : 'Instance Details';

  return (
    <Box>
      <PageHeader
        title={workflowLabel}
        onBack={() => navigate('/instances')}
        chip={instance ? <StatusChip status={instance.status} /> : undefined}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Reload">
              <IconButton size="small" onClick={() => id && fetch(id)} disabled={loading}
                sx={{ color: 'text.secondary' }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canResume && (
              <Button
                variant="contained"
                size="small"
                startIcon={loading ? <CircularProgress size={14} /> : <PlayArrowIcon />}
                onClick={handleResume}
                disabled={loading}
              >
                Resume Instance
              </Button>
            )}
          </Box>
        }
      />

      {loading && !instance && (
        <Box display="flex" flexDirection="column" gap={2}>
          <Skeleton variant="rounded" height={200} />
          <Skeleton variant="rounded" height={160} />
        </Box>
      )}

      {!loading && !instance && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography color="text.secondary">Instance not found.</Typography>
        </Box>
      )}

      {instance && (
        <Box display="flex" flexDirection="column" gap={2}>
          {!instance.auto_advance && instance.status !== 'paused' && (
            <Box
              sx={{
                px: 2,
                py: 1,
                borderRadius: 1,
                backgroundColor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Chip
                label="Manual Mode"
                size="small"
                sx={{ fontFamily: MONO, fontSize: 11, height: 22 }}
              />
              <Typography fontSize={13} color="text.secondary">
                This instance requires manual execution to advance between nodes.
              </Typography>
            </Box>
          )}

          <DetailInfoSection instance={instance} />
          <ExecutionDetails />
        </Box>
      )}
    </Box>
  );
}
