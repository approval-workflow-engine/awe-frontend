import { useState, useCallback, useRef } from "react";
import { useApiCall } from "../../../hooks/useApiCall";
import { taskService } from "../../../api/services/task";
import type { TaskDetail } from "../../../api/schemas/task";

export function useTask() {
  const { loading, error, call } = useApiCall();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const currentRequestRef = useRef<string | null>(null);

  const fetch = useCallback(
    async (id: string) => {
      // Cancel any previous request by marking it obsolete
      currentRequestRef.current = id;

      // Clear existing task state when fetching new task
      setTask(null);

      const taskData = await call(() => taskService.getTaskDetail(id));

      // Only update state if this request is still current
      if (currentRequestRef.current === id && taskData) {
        setTask(taskData as TaskDetail);
        return taskData;
      }

      return null;
    },
    [call],
  );

  const complete = useCallback(
    async (id: string, userInput: Record<string, unknown>) => {
      return call(() => taskService.completeTask(id, userInput), {
        successMsg: "Task completed successfully",
      });
    },
    [call],
  );

  return { task, loading, error, fetch, complete };
}
