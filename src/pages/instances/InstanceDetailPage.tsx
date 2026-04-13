import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Chip, Skeleton } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import DetailInfoSection from "./components/DetailInfoSection";
import {
  ExecutionFlowCard,
  NodeExecutionDetailsCard,
} from "./components/ExecutionDetails.tsx";
import InstanceHeaderActions from "./components/InstanceHeaderActions";
import { useInstance } from "./hooks/useInstance";
import { useExecutionLogs } from "./hooks/useExecutionLogs";
import { useBackNavigation } from "../../hooks/useBackNavigation";
import type {
  Instance,
  InstanceListItem,
  CurrentTask,
} from "../../api/schemas/instance";
import { taskService } from "../../api/services/task";

const MONO = "'JetBrains Mono', monospace";

const isUserTaskType = (nodeType: string) => {
  const normalized = nodeType.toLowerCase();
  return normalized === "user" || normalized === "user_task";
};

function toInstanceFromListItem(item: InstanceListItem): Instance {
  return {
    id: item.id,
    inputVariables: item.input_variables,
    currentVariables: item.current_variables,
    outputVariables: item.output_variables,
    status: item.status,
    startedAt: item.started_on,
    endedAt: item.ended_on,
    autoAdvance: item.auto_advance,
    workflow: {
      name: item.workflow_name,
      id: item.workflow_version_id,
      version: item.version_number ?? 0,
    },
    currentTask: null,
  };
}

export default function InstanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { goBack } = useBackNavigation("/instances");
  const {
    instance,
    loading,
    fetch,
    silentFetch,
    resume,
    pause,
    terminate,
    retry,
    isTerminal,
  } = useInstance();

  const stateInstance =
    (location.state as { instance?: Instance | InstanceListItem } | null)
      ?.instance ?? null;

  const navInstance = stateInstance
    ? "workflow" in stateInstance
      ? stateInstance
      : toInstanceFromListItem(stateInstance)
    : null;

  const displayInstance: Instance | null = instance ? instance : navInstance;

  const {
    logsLoading,
    orderedExecutions,
    selectedNodeId,
    setSelectedNodeId,
    selectedExecutionNode,
    refreshInstanceAndLogs,
  } = useExecutionLogs({
    instanceId: id,
    instance,
    fetchInstance: fetch,
    silentFetchInstance: silentFetch,
    isTerminal,
  });

  const canResume = displayInstance?.status === "paused";
  const canPause =
    displayInstance?.status === "in_progress" &&
    !isTerminal(displayInstance.status);
  const canTerminate = !!displayInstance && !isTerminal(displayInstance.status);
  const canRetry = displayInstance?.status === "failed";

  const handleResume = async () => {
    if (!id) return;
    await resume(id);
    await refreshInstanceAndLogs();
  };

  const handlePause = async () => {
    if (!id) return;
    await pause(id);
    await refreshInstanceAndLogs();
  };

  const handleTerminate = async () => {
    if (!id) return;
    await terminate(id);
    await refreshInstanceAndLogs();
  };

  const handleRetry = async () => {
    if (!id) return;
    await retry(id);
    await refreshInstanceAndLogs();
  };

  const handleReload = () => {
    refreshInstanceAndLogs();
  };

  const workflowLabel = displayInstance?.workflow
    ? `Instance - Workflow Version ${displayInstance.workflow.version}`
    : "Instance Details";

  const currentTask: CurrentTask | null = displayInstance?.currentTask ?? null;
  const showReviewAction =
    !!selectedExecutionNode &&
    isUserTaskType(selectedExecutionNode.nodeType) &&
    selectedExecutionNode.status === "in_progress" &&
    Boolean(selectedExecutionNode.userTaskExecutionId);

  const handleReviewTask = () => {
    if (!selectedExecutionNode?.userTaskExecutionId) return;
    navigate(`/tasks/${selectedExecutionNode.userTaskExecutionId}`, {
      state: { fromInstance: id },
    });
  };

  const handleRetryTask = async () => {
    if (!selectedExecutionNode?.taskId) return;
    try {
      await taskService.retryTask(selectedExecutionNode.taskId);
      await refreshInstanceAndLogs();
    } catch (e) {
      console.error("Task retry failed:", e);
    }
  };

  return (
    <Box>
      <PageHeader
        title={workflowLabel}
        onBack={goBack}
        action={
          <InstanceHeaderActions
            loading={loading}
            canPause={canPause}
            canResume={canResume}
            canTerminate={canTerminate}
            canRetry={canRetry}
            onReload={handleReload}
            onPause={handlePause}
            onResume={handleResume}
            onTerminate={handleTerminate}
            onRetry={handleRetry}
          />
        }
      />

      {loading && !displayInstance && (
        <Box display="flex" flexDirection="column" gap={2}>
          <Skeleton variant="rounded" height={200} />
          <Skeleton variant="rounded" height={160} />
        </Box>
      )}

      {!loading && !displayInstance && (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography color="text.secondary">Instance not found.</Typography>
        </Box>
      )}

      {displayInstance && (
        <Box
          display="flex"
          flexDirection="column"
          gap={2}
          sx={{ height: "calc(100vh - 140px)" }}
        >
          {!displayInstance.autoAdvance &&
            displayInstance.status === "in_progress" && (
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  backgroundColor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Chip
                  label="Manual Mode"
                  size="small"
                  sx={{ fontFamily: MONO, fontSize: 11, height: 22 }}
                />
                <Typography fontSize={13} color="text.secondary">
                  This instance requires manual execution to advance between
                  nodes.
                </Typography>
              </Box>
            )}

          <DetailInfoSection instance={displayInstance} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              alignItems: "stretch",
              flex: 1,
              minHeight: 0,
            }}
          >
            <ExecutionFlowCard
              nodes={orderedExecutions}
              loading={logsLoading}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              currentTaskNodeClientId={currentTask?.nodeId ?? null}
            />
            <NodeExecutionDetailsCard
              nodes={orderedExecutions}
              selectedNodeId={selectedNodeId}
              onReviewTask={showReviewAction ? handleReviewTask : undefined}
              onRetryTask={
                selectedExecutionNode?.status === "failed"
                  ? handleRetryTask
                  : undefined
              }
              loading={logsLoading}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
