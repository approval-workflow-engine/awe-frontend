import { useCallback, useEffect, useMemo, useState } from "react";
import { usePolling } from "../../../hooks/usePolling";
import { getInstanceExecutions } from "../../../api/instanceApi";
import type { ExecutionNode, Instance } from "../../../api/schemas/instance";

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
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const fetchExecutionLogs = useCallback(
    async (targetInstanceId: string, silent = false) => {
      if (!silent) {
        setLogsLoading(true);
      }

      try {
        const response = await getInstanceExecutions(targetInstanceId);
        setExecutions(response?.data?.executions ?? []);
      } catch (error) {
        console.error("Failed to fetch execution logs:", error);
      } finally {
        if (!silent) {
          setLogsLoading(false);
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
    fetchExecutionLogs(instanceId);
  }, [instanceId, fetchInstance, fetchExecutionLogs]);

  const shouldPoll = !!instance && !isTerminal(instance.status);

  usePolling(
    () => {
      if (!instanceId || !shouldPoll) {
        return;
      }

      silentFetchInstance(instanceId);
      fetchExecutionLogs(instanceId, true);
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
      orderedExecutions.find((node) => node.nodeId === selectedNodeId) ?? null,
    [orderedExecutions, selectedNodeId],
  );

  useEffect(() => {
    if (orderedExecutions.length === 0) {
      setSelectedNodeId(null);
      return;
    }

    setSelectedNodeId((previousSelectedNodeId) => {
      if (
        previousSelectedNodeId &&
        orderedExecutions.some((node) => node.nodeId === previousSelectedNodeId)
      ) {
        return previousSelectedNodeId;
      }

      const latestExecutedNode = [...orderedExecutions]
        .reverse()
        .find((node) => node.status !== "pending");

      return latestExecutedNode?.nodeId ?? orderedExecutions[0].nodeId;
    });
  }, [orderedExecutions]);

  const refreshExecutionLogs = useCallback(async () => {
    if (!instanceId) {
      return;
    }

    await fetchExecutionLogs(instanceId);
  }, [instanceId, fetchExecutionLogs]);

  const refreshInstanceAndLogs = useCallback(async () => {
    if (!instanceId) {
      return;
    }

    await fetchInstance(instanceId);
    await fetchExecutionLogs(instanceId);
  }, [instanceId, fetchInstance, fetchExecutionLogs]);

  return {
    logsLoading,
    orderedExecutions,
    selectedNodeId,
    setSelectedNodeId,
    selectedExecutionNode,
    refreshExecutionLogs,
    refreshInstanceAndLogs,
  };
}
