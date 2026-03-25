import { useState, useCallback } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { getTasks } from '../../../api/taskApi';
import type { PendingUserTask } from '../../../api/schemas/task';

export function useTasks() {
  const { loading, error, call } = useApiCall();
  const [tasks, setTasks] = useState<PendingUserTask[]>([]);

  const fetch = useCallback(async () => {
    const res = await call(() => getTasks({ status: 'in_progress' }));
    setTasks(res?.tasks ?? []);
  }, [call]);

  const silentFetch = useCallback(async () => {
    const res = await call(() => getTasks({ status: 'in_progress' }), { silent: true });
    setTasks(res?.tasks ?? []);
  }, [call]);

  return { tasks, loading, error, fetch, silentFetch };
}
