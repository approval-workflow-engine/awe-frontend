import { useEffect, useRef, useState, useCallback } from 'react';
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
import { useApiCall } from '../../hooks/useApiCall';
import { getInstanceExecutions } from '../../api/instanceApi';
import type { Instance, ExecutionLog, InstanceListItem } from '../../api/schemas/instance';

const MONO = "'JetBrains Mono', monospace";
const POLL_INTERVAL_MS = 3000;

function toInstanceFromListItem(item: InstanceListItem): Instance {
  return {
    id: item.id,
    inputVariables: item.input_variables,
    currentVariables: item.current_variables,
    outputVariables: item.output_variables,
    status: item.status,
    startedAt: item.started_on,
    endedAt: item.ended_on,
    autoAdvance: item.auto_advance,
    workflow: {
      name: item.workflow_name,
      id: item.workflow_version_id,
      version: item.version_number ?? 0,
    },
    currentTask: null,
  };
}

export default function InstanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { instance, loading, fetch, silentFetch, resume, isTerminal } = useInstance();
  const pollEnabled = useRef(false);
  const { call } = useApiCall();
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const stateInstance =
    (location.state as { instance?: Instance | InstanceListItem } | null)?.instance ?? null;

  const navInstance = stateInstance
    ? ('workflow' in stateInstance ? stateInstance : toInstanceFromListItem(stateInstance))
    : null;

  const displayInstance: Instance | null = instance
    ? instance
    : navInstance;

  const fetchExecutionLogs = useCallback(async (instanceId: string, silent = false) => {
    if (!silent) setLogsLoading(true);
    try {
      const response = await call(() => getInstanceExecutions(instanceId), {
        silent: true,
        showError: false,
      });
      if (response?.executions) {
        setExecutionLogs(response.executions);
      }
    } catch (error) {
      console.error('Failed to fetch execution logs:', error);
    } finally {
      if (!silent) setLogsLoading(false);
    }
  }, [call]);

  useEffect(() => {
    if (id) {
      fetch(id);
      fetchExecutionLogs(id);
    }
  }, [id, fetch, fetchExecutionLogs]);

  useEffect(() => {
    pollEnabled.current = !!instance && !isTerminal(instance.status);
  }, [instance, isTerminal]);

  usePolling(
    () => {
      if (id && pollEnabled.current) {
        silentFetch(id);
        fetchExecutionLogs(id, true);
      }
    },
    POLL_INTERVAL_MS,
    true,
  );

  const canResume =
    displayInstance?.autoAdvance === false && displayInstance?.status === 'paused';

  const handleResume = async () => {
    if (!id) return;
    await resume(id);
    await fetch(id);
    await fetchExecutionLogs(id);
  };

  const handleReload = () => {
    if (id) {
      fetch(id);
      fetchExecutionLogs(id);
    }
  };

  const workflowLabel = displayInstance?.workflow
    ? `Instance - Workflow Version ${displayInstance.workflow.version}`
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
                onClick={handleReload}
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
          {!displayInstance.autoAdvance && displayInstance.status === 'in_progress' && (
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
          <ExecutionDetails logs={executionLogs} loading={logsLoading} />
        </Box>
      )}
    </Box>
  );
}
