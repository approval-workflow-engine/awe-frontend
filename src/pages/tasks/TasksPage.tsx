import { useEffect } from 'react';
import { Box, IconButton, Paper, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageHeader from '../../components/common/PageHeader';
import TaskTable from './components/TaskTable';
import { useTasks } from './hooks/useTasks';
import { usePolling } from '../../hooks/usePolling';

const POLL_INTERVAL_MS = 5000;

export default function TasksPage() {
  const { tasks, loading, fetch, silentFetch } = useTasks();

  useEffect(() => { fetch(); }, [fetch]);

  usePolling(() => { silentFetch(); }, POLL_INTERVAL_MS, true);

  return (
    <Box>
      <PageHeader
        title="Pending Tasks"
        subtitle="Review and complete tasks waiting for manual approval"
        action={
          <Tooltip title="Reload">
            <IconButton size="small" onClick={() => fetch()} disabled={loading}
              sx={{ color: 'text.secondary' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      />
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <TaskTable tasks={tasks} loading={loading} />
      </Paper>
    </Box>
  );
}
