import { useEffect } from 'react';
import { Box, Paper, LinearProgress } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import TaskTable from './components/TaskTable';
import { useTasks } from './hooks/useTasks';

export default function TasksPage() {
  const { tasks, loading, fetch } = useTasks();

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <Box>
      <PageHeader
        title="Pending Tasks"
        subtitle="Review and complete tasks waiting for manual approval"
      />
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <TaskTable tasks={tasks} />
      </Paper>
    </Box>
  );
}
