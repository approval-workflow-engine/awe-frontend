import { useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import DetailInfoSection from './components/DetailInfoSection';
import ExecutionDetails from './components/ExecutionDetails';
import { useInstance } from './hooks/useInstance';
import { usePolling } from '../../hooks/usePolling';
import type { BackendInstance } from '../../types';

const MONO = "'JetBrains Mono', monospace";
const POLL_INTERVAL_MS = 3000;

export default function InstanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { instance, loading, fetch, silentFetch, resume, isTerminal } = useInstance();
  const pollEnabled = useRef(false);

  const navInstance =
    (location.state as { instance?: BackendInstance } | null)?.instance ?? null;

  const displayInstance: BackendInstance | null = instance
    ? {
        ...instance,
        workflow_name: instance.workflow_name ?? navInstance?.workflow_name,
        version_number: instance.version_number ?? navInstance?.version_number,
      }
    : navInstance;

  useEffect(() => {
    if (id) fetch(id);
  }, [id, fetch]);

  useEffect(() => {
    pollEnabled.current = !!instance && !isTerminal(instance.status);
  }, [instance, isTerminal]);

  usePolling(
    () => {
      if (id && pollEnabled.current) silentFetch(id);
    },
    POLL_INTERVAL_MS,
    true,
  );

  const canResume =
    displayInstance?.auto_advance === false && displayInstance?.status === 'paused';

  const handleResume = async () => {
    if (!id) return;
    await resume(id);
    await fetch(id);
  };

  const workflowLabel = displayInstance?.workflow_name
    ? `${displayInstance.workflow_name} - Version ${displayInstance.version_number}`
    : 'Instance Details';

  return (
    <Box>
      <PageHeader
        title={workflowLabel}
        onBack={() => navigate('/instances')}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Reload">
              <IconButton
                size="small"
                onClick={() => id && fetch(id)}
                disabled={loading}
                sx={{ color: 'text.secondary' }}
              >
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

      {loading && !displayInstance && (
        <Box display="flex" flexDirection="column" gap={2}>
          <Skeleton variant="rounded" height={200} />
          <Skeleton variant="rounded" height={160} />
        </Box>
      )}

      {!loading && !displayInstance && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography color="text.secondary">Instance not found.</Typography>
        </Box>
      )}

      {displayInstance && (
        <Box display="flex" flexDirection="column" gap={2}>
          {!displayInstance.auto_advance && displayInstance.status === 'in_progress' && (
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

          <DetailInfoSection instance={displayInstance} />
          <ExecutionDetails />
        </Box>
      )}
    </Box>
  );
}
