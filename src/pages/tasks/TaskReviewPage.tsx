import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Skeleton, Paper } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import TaskInfoSection from './components/TaskInfoSection';
import TaskInputForm from './components/TaskInputForm';
import { useTask } from './hooks/useTask';

export default function TaskReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { task, loading, error, fetch, complete } = useTask();

  useEffect(() => {
    if (id) fetch(id);
  }, [id, fetch]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!id) return;
    const result = await complete(id, values);
    if (result !== null) navigate('/tasks');
  };

  const title = task?.node_configuration.title || 'Task Review';

  return (
    <Box>
      <PageHeader
        title={title}
        subtitle={task?.workflow_name}
        onBack={() => navigate('/tasks')}
        chip={task ? <StatusChip status={task.status} /> : undefined}
      />

      {loading && !task && (
        <Box display="flex" flexDirection="column" gap={2}>
          <Skeleton variant="rounded" height={220} />
          <Skeleton variant="rounded" height={280} />
        </Box>
      )}

      {!loading && !task && error && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography color="error.main" fontSize={14}>
            Failed to load task. Please try again.
          </Typography>
        </Box>
      )}

      {!loading && !task && !error && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography color="text.secondary" fontSize={14}>
            Task not found.
          </Typography>
        </Box>
      )}

      {task && task.status !== 'in_progress' && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <StatusChip status={task.status} />
          <Typography color="text.secondary" fontSize={13} mt={1.5}>
            This task is no longer available for review.
          </Typography>
        </Paper>
      )}

      {task && task.status === 'in_progress' && (
        <Box display="flex" flexDirection="column" gap={2}>
          <TaskInfoSection task={task} />
          <TaskInputForm
            key={task.id}
            fields={task.node_configuration.responseMap}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </Box>
      )}
    </Box>
  );
}
