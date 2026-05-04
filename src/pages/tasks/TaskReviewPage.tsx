import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import TaskInfoSection from './components/TaskInfoSection';
import TaskInputForm from './components/TaskInputForm';
import { useTask } from './hooks/useTask';
import { TASK_STATUS, UI_TEXT } from '../../constants/status';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import {
  NotFoundState,
  ForbiddenState,
  ErrorState,
  LoadingState,
} from '../../components/common/states';

const RETRY_INTERVAL_MS = 1000;
const MAX_RETRIES = 5;

export default function TaskReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { task, loading, error, notFound, forbidden, fetch, complete } = useTask();
  const { goBack } = useBackNavigation('/tasks');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (id) fetch(id);
  }, [id, fetch]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    // Only retry if it is an explicit 404/NotFound during polling or general unknown error
    if (!loading && !task && !error && retryCount < MAX_RETRIES) {
      timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        if (id) fetch(id);
      }, RETRY_INTERVAL_MS);
    }
    return () => clearTimeout(timer);
  }, [loading, task, error, id, fetch, retryCount]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!id) return;
    const result = await complete(id, values);
    if (result !== null) navigate('/tasks');
  };

  const title = task?.title || UI_TEXT.TASK_REVIEW;
  const responseFields = task?.responseData ?? [];

  if (forbidden) return <ForbiddenState message={error || "You do not have access to this task"} />;
  
  // If not found and we exhausted retries, show NotFoundState
  if ((notFound || (!task && !loading && !error)) && retryCount >= MAX_RETRIES) {
    return <NotFoundState message={error || "Task not found. It may have been completed or archived."} />;
  }

  // General error (500)
  if (error && !task && !notFound && !forbidden) {
    return <ErrorState message={error} onRetry={() => id && fetch(id)} />;
  }

  return (
    <Box>
      <PageHeader
        title={title}
        subtitle={task?.instanceId ? `Instance ID: ${task.instanceId.slice(0, 8)}` : undefined}
        onBack={goBack}
        chip={task ? <StatusChip status={task.status} /> : undefined}
      />

      {loading && !task && (
        <LoadingState text="Loading task details..." />
      )}

      {!loading && !task && !error && retryCount < MAX_RETRIES && (
        <Box sx={{ py: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary" fontSize={13}>
            Loading task (attempt {retryCount + 1}/{MAX_RETRIES})...
          </Typography>
        </Box>
      )}

      {task && task.status !== TASK_STATUS.IN_PROGRESS && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <StatusChip status={task.status} />
          <Typography color="text.secondary" fontSize={13} mt={1.5}>
            This task is no longer available for review.
          </Typography>
        </Paper>
      )}

      {task && task.status === TASK_STATUS.IN_PROGRESS && (
        <Box display="flex" flexDirection="column" gap={2}>
          <TaskInfoSection task={task} />
          <TaskInputForm
            key={task.id}
            fields={responseFields}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </Box>
      )}
    </Box>
  );
}
