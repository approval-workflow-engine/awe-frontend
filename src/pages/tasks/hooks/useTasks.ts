import { useState, useCallback } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { getTasks } from '../../../api/taskApi';
import type { BackendTask } from '../../../types';

export function useTasks() {
  const { loading, error, call } = useApiCall();
  const [tasks, setTasks] = useState<BackendTask[]>([]);

  const fetch = useCallback(async () => {
    const res = await call(() => getTasks({ status: 'in_progress' }));
    const payload = res as { tasks?: BackendTask[] } | BackendTask[] | null;
    setTasks(Array.isArray(payload) ? payload : payload?.tasks ?? []);
  }, [call]);

  const silentFetch = useCallback(async () => {
    const res = await call(() => getTasks({ status: 'in_progress' }), { silent: true });
    const payload = res as { tasks?: BackendTask[] } | BackendTask[] | null;
    setTasks(Array.isArray(payload) ? payload : payload?.tasks ?? []);
  }, [call]);

  return { tasks, loading, error, fetch, silentFetch };
}
