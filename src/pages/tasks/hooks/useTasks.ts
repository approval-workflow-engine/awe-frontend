import { useState, useCallback } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { getTasks } from '../../../api/taskApi';
import type { BackendTask } from '../../../types';

export function useTasks() {
  const { loading, error, call } = useApiCall();
  const [tasks, setTasks] = useState<BackendTask[]>([]);

  const fetch = useCallback(async () => {
    const res = await call(() => getTasks());
    setTasks((res as { tasks: BackendTask[] } | null)?.tasks ?? []);
  }, [call]);

  return { tasks, loading, error, fetch };
}
