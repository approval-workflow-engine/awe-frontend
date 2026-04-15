import { useCallback, useEffect, useMemo, useState } from "react";
import { usePolling } from "../../../hooks/usePolling";
import { instanceService } from "../../../api/services/instance";
import type {
  ExecutionNode,
  Instance,
  TaskExecutionDetailResponse,
} from "../../../api/schemas/instance";

const DEFAULT_POLL_INTERVAL_MS = 3000;

interface UseExecutionLogsParams {
  instanceId?: string;
  instance: Instance | null;
  fetchInstance: (id: string) => Promise<unknown>;
  silentFetchInstance: (id: string) => Promise<unknown>;
  isTerminal: (status: string | undefined) => boolean;
  pollIntervalMs?: number;
}

export function useExecutionLogs({
  instanceId,
  instance,
  fetchInstance,
  silentFetchInstance,
  isTerminal,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: UseExecutionLogsParams) {
  const [executions, setExecutions] = useState<ExecutionNode[]>([]);
  const [sequenceLoading, setSequenceLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<
    TaskExecutionDetailResponse | null
  >(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);

  const fetchExecutionSequence = useCallback(
    async (targetInstanceId: string, silent = false) => {
      if (!silent) {
        setSequenceLoading(true);
      }

      try {
        const response = await instanceService.getExecutionSequence(
          targetInstanceId,
        );
        setExecutions(response?.executionSequence ?? []);
      } catch (error) {
        console.error("Failed to fetch execution sequence:", error);
      } finally {
        if (!silent) {
          setSequenceLoading(false);
        }
      }
    },
    [],
  );

  const fetchTaskDetail = useCallback(
    async (targetInstanceId: string, taskId: string | null, silent = false) => {
      if (!taskId) {
        setSelectedTaskDetail(null);
        return;
      }

      if (!silent) {
        setTaskDetailLoading(true);
      }

      try {
        const response = await instanceService.getTaskDetail(
          targetInstanceId,
          taskId,
        );
        setSelectedTaskDetail(response ?? null);
      } catch (error) {
        console.error("Failed to fetch task detail:", error);
        setSelectedTaskDetail(null);
      } finally {
        if (!silent) {
          setTaskDetailLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!instanceId) {
      return;
    }

    fetchInstance(instanceId);
    fetchExecutionSequence(instanceId);
  }, [instanceId, fetchInstance, fetchExecutionSequence]);

  const shouldPoll = !!instance && !isTerminal(instance.status);

  usePolling(
    () => {
      if (!instanceId || !shouldPoll) {
        return;
      }

      silentFetchInstance(instanceId);
      fetchExecutionSequence(instanceId, true);
    },
    pollIntervalMs,
    true,
  );

  const orderedExecutions = useMemo(
    () => [...executions].sort((a, b) => a.order - b.order),
    [executions],
  );

  const selectedExecutionNode = useMemo(
    () =>
      orderedExecutions.find((node) => node.nodeClientId === selectedNodeId) ??
      null,
    [orderedExecutions, selectedNodeId],
  );

  useEffect(() => {
    if (!instanceId || !selectedExecutionNode) {
      setSelectedTaskDetail(null);
      return;
    }

    setSelectedTaskDetail(null);
    fetchTaskDetail(instanceId, selectedExecutionNode.taskId ?? null);
  }, [
    instanceId,
    selectedNodeId,
    selectedExecutionNode?.taskId,
    selectedExecutionNode?.taskExecutionId,
    fetchTaskDetail,
  ]);

  useEffect(() => {
    if (orderedExecutions.length === 0) {
      setSelectedNodeId(null);
      return;
    }

    setSelectedNodeId((previousSelectedNodeId) => {
      if (
        previousSelectedNodeId &&
        orderedExecutions.some(
          (node) => node.nodeClientId === previousSelectedNodeId,
        )
      ) {
        return previousSelectedNodeId;
      }

      const latestExecutedNode = [...orderedExecutions]
        .reverse()
        .find((node) => node.status !== "pending");

      return latestExecutedNode?.nodeClientId ?? orderedExecutions[0].nodeClientId;
    });
  }, [orderedExecutions]);

  const refreshExecutionLogs = useCallback(async () => {
    if (!instanceId) {
      return;
    }

    await fetchExecutionSequence(instanceId);
    await fetchTaskDetail(instanceId, selectedExecutionNode?.taskId ?? null);
  }, [instanceId, fetchExecutionSequence, fetchTaskDetail, selectedExecutionNode?.taskId]);

  const refreshInstanceAndLogs = useCallback(async () => {
    if (!instanceId) {
      return;
    }

    await fetchInstance(instanceId);
    await fetchExecutionSequence(instanceId);
    await fetchTaskDetail(instanceId, selectedExecutionNode?.taskId ?? null, true);
  }, [instanceId, fetchInstance, fetchExecutionSequence, fetchTaskDetail, selectedExecutionNode?.taskId]);

  return {
    sequenceLoading,
    taskDetailLoading,
    orderedExecutions,
    selectedNodeId,
    setSelectedNodeId,
    selectedExecutionNode,
    selectedTaskDetail,
    refreshExecutionLogs,
    refreshInstanceAndLogs,
  };
}
