import { useState, useCallback } from "react";
import { useApiCall } from "../../../hooks/useApiCall";
import { taskService } from "../../../api/services/task";
import type {
  PendingUserTask,
  PendingTasksQueryParams,
} from "../../../api/schemas/task";
import type { Pagination } from "../../../api/schemas/common";

interface FetchResult {
  tasks: PendingUserTask[];
  pagination?: Pagination;
}

export function useTasks() {
  const { loading, error, call } = useApiCall();
  const [tasks, setTasks] = useState<PendingUserTask[]>([]);

  const fetch = useCallback(
    async (params?: PendingTasksQueryParams): Promise<FetchResult | null> => {
      const res = await call(() => taskService.getPendingTasks(params));
      const tasks_ = res?.userTasks ?? [];
      setTasks(tasks_);
      return res as FetchResult | null;
    },
    [call],
  );

  const silentFetch = useCallback(
    async (params?: PendingTasksQueryParams) => {
      const res = await call(() => taskService.getPendingTasks(params), {
        silent: true,
      });
      const tasks_ = res?.userTasks ?? [];
      setTasks(tasks_);
      return res as FetchResult | null;
    },
    [call],
  );

  return { tasks, loading, error, fetch, silentFetch };
}
