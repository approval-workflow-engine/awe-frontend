import { useState, useCallback } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { getTask, completeTask as completeApi } from '../../../api/taskApi';
import type { BackendTaskDetail } from '../../../types';

export function useTask() {
  const { loading, error, call } = useApiCall();
  const [task, setTask] = useState<BackendTaskDetail | null>(null);

  const fetch = useCallback(async (id: string) => {
    const res = await call(() => getTask(id));
    const t =
      (res as { task?: BackendTaskDetail } | null)?.task ??
      ((res as BackendTaskDetail | null)?.id
        ? (res as BackendTaskDetail)
        : null);
    setTask(t);
    return t;
  }, [call]);

  const complete = useCallback(async (id: string, userInput: Record<string, unknown>) => {
    return call(() => completeApi(id, userInput), { successMsg: 'Task completed successfully' });
  }, [call]);

  return { task, loading, error, fetch, complete };
}
