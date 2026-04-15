import { useMemo, useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, Button, Tabs, Tab, CircularProgress } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import type {
  ExecutionNode,
  TaskExecutionDetailResponse,
} from '../../../api/schemas/instance';
import { NodeConfigurationDisplay } from './NodeConfigurationDisplay';

const MONO = "'JetBrains Mono', monospace";

type NodeStatus = ExecutionNode['status'];

const isUserTaskType = (nodeType: string) => {
  const normalized = nodeType.toLowerCase();
  return normalized === 'user' || normalized === 'user_task';
};

function getStatusIcon(status: NodeStatus) {
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircleIcon sx={{ fontSize: 16, color: '#22c55e' }} />;
    case 'failed':
    case 'terminated':
      return <ErrorIcon sx={{ fontSize: 16, color: '#ef4444' }} />;
    case 'in_progress':
      return <HourglassEmptyIcon sx={{ fontSize: 16, color: '#06b6d4' }} />;
    case 'discarded':
      return <HighlightOffIcon sx={{ fontSize: 16, color: '#9ca3af' }} />;
    case 'pending':
      return <PendingIcon sx={{ fontSize: 16, color: '#9ca3af' }} />;
    default:
      return null;
  }
}

function getStatusColor(status: NodeStatus) {
  switch (status.toLowerCase()) {
    case 'completed':
      return '#22c55e';
    case 'failed':
    case 'terminated':
      return '#ef4444';
    case 'in_progress':
      return '#06b6d4';
    case 'discarded':
      return '#9ca3af';
    default:
      return '#6b7280';
  }
}

function formatDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '-';
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const durationMs = endTime - startTime;

  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function formatTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

function JsonDisplay({ title, data }: { title: string; data: unknown | null }) {
  if (data === null || data === undefined) return null;

  if (
    typeof data === 'object' &&
    !Array.isArray(data) &&
    Object.keys(data as Record<string, unknown>).length === 0
  ) {
    return null;
  }

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={0.5}>
        {title}
      </Typography>
      <Box
        component="pre"
        sx={{
          fontFamily: MONO,
          fontSize: 11,
          m: 0,
          p: 1.5,
          borderRadius: 1,
          backgroundColor: 'action.hover',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: 200,
          overflowY: 'auto',
        }}
      >
        {JSON.stringify(data, null, 2)}
      </Box>
    </Box>
  );
}

interface ExecutionFlowCardProps {
  nodes: ExecutionNode[];
  loading?: boolean;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  currentTaskNodeClientId?: string | null;
}

export function ExecutionFlowCard({
  nodes,
  loading,
  selectedNodeId,
  onSelectNode,
  currentTaskNodeClientId,
}: ExecutionFlowCardProps) {
  const totalNodes = nodes.length;
  const completedNodes = nodes.filter((node) => node.status === 'completed').length;

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const groupedNodes = useMemo(() => {
    const groups: Array<ExecutionNode | { isGroup: true; id: string; nodes: ExecutionNode[] }> = [];
    let currentDiscardedGroup: ExecutionNode[] = [];

    for (const node of nodes) {
      if (node.status === 'discarded') {
        currentDiscardedGroup.push(node);
      } else {
        if (currentDiscardedGroup.length > 0) {
          groups.push({
            isGroup: true,
            id: `discarded-group-${currentDiscardedGroup[0].nodeClientId}`,
            nodes: currentDiscardedGroup,
          });
          currentDiscardedGroup = [];
        }
        groups.push(node);
      }
    }
    if (currentDiscardedGroup.length > 0) {
      groups.push({
        isGroup: true,
        id: `discarded-group-${currentDiscardedGroup[0].nodeClientId}`,
        nodes: currentDiscardedGroup,
      });
    }

    return groups;
  }, [nodes]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const renderNode = (node: ExecutionNode) => {
    const isSelected = node.nodeClientId === selectedNodeId;
    const isReviewable =
      !!currentTaskNodeClientId &&
      node.nodeClientId === currentTaskNodeClientId &&
      isUserTaskType(node.nodeType) &&
      node.status === 'in_progress';

    return (
      <Box
        key={node.nodeClientId}
        role="button"
        tabIndex={0}
        onClick={() => onSelectNode(node.nodeClientId)}
        sx={{
          border: '2px solid',
          borderColor: isSelected ? 'primary.main' : isReviewable ? '#f97316' : 'transparent',
          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : isReviewable ? 'rgba(249,115,22,0.05)' : node.status === 'pending' ? 'action.hover' : 'background.paper',
          boxShadow: isSelected ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
          borderRadius: 2,
          p: 1.25,
          opacity: node.status === 'pending' ? 0.65 : 1,
          cursor: 'pointer',
          transition: 'all .2s ease',
          '&:hover': {
            borderColor: !isSelected && !isReviewable ? 'divider' : undefined,
          }
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} width="100%">
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', minWidth: 20, textAlign: 'center' }}>
            {node.order}
          </Typography>

          <Box display="flex" alignItems="center" gap={0.5}>
            {getStatusIcon(node.status)}
          </Box>

          <Box flex={1} minWidth={0}>
            <Typography fontSize={13} fontWeight={isSelected ? 700 : 500} noWrap>
              {node.nodeName || `${node.nodeType} Node`}
            </Typography>
            <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: MONO }}>
              {node.nodeType} • {node.nodeClientId}
            </Typography>
          </Box>

          <Box textAlign="right">
            <Typography sx={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: getStatusColor(node.status), textTransform: 'uppercase' }}>
              {node.status}
            </Typography>
            <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: MONO }}>
              {formatDuration(node.startTime, node.endTime)}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box display="flex" alignItems="center" gap={1} mb={2} flexShrink={0}>
        <TimelineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography fontWeight={700} fontSize={15}>
          Workflow Execution
        </Typography>
        {totalNodes > 0 && (
          <Chip label={`${completedNodes}/${totalNodes} completed`} size="small" sx={{ ml: 1, height: 20, fontSize: 11 }} />
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 1 }}>
        {loading && (
          <Box sx={{ py: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
            <Typography color="text.secondary" fontSize={13}>Loading execution workflow...</Typography>
          </Box>
        )}

        {!loading && nodes.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
            <Typography color="text.secondary" fontSize={13}>No workflow tasks found for this instance.</Typography>
          </Box>
        )}

        {!loading && nodes.length > 0 && (
          <Box display="flex" flexDirection="column" gap={1}>
            {groupedNodes.map((item) => {
              if ('isGroup' in item) {
                const isExpanded = expandedGroups.has(item.id);

                if (!isExpanded) {
                  return (
                    <Box
                      key={item.id}
                      onClick={() => toggleGroup(item.id)}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        textAlign: 'center',
                        backgroundColor: 'action.hover',
                        borderRadius: 2,
                        border: '1px dashed',
                        borderColor: 'divider',
                        transition: 'all .2s ease',
                        '&:hover': { backgroundColor: 'action.focus' }
                      }}
                    >
                      <Typography fontSize={11} color="text.secondary" fontWeight={600}>
                        {item.nodes.length} discarded task{item.nodes.length > 1 ? 's' : ''} ... Click to expand
                      </Typography>
                    </Box>
                  );
                }

                return (
                  <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box
                      onClick={() => toggleGroup(item.id)}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        textAlign: 'center',
                        backgroundColor: 'action.hover',
                        borderRadius: 2,
                        border: '1px dashed',
                        borderColor: 'divider',
                        transition: 'all .2s ease',
                        '&:hover': { backgroundColor: 'action.focus' }
                      }}
                    >
                      <Typography fontSize={11} color="text.secondary" fontWeight={600}>
                        Collapse discarded tasks
                      </Typography>
                    </Box>
                    {item.nodes.map((node) => renderNode(node))}
                  </Box>
                );
              }

              return renderNode(item);
            })}

            <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 1, mt: 1, textAlign: 'center' }}>
              <Typography fontSize={11} color="text.secondary">
                Executions recorded: {nodes.filter((item) => item.status !== 'pending').length}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

interface NodeExecutionDetailsCardProps {
  nodes: ExecutionNode[];
  selectedNodeId: string | null;
  selectedTaskDetail: TaskExecutionDetailResponse | null;
  onReviewTask?: () => void;
  onRetryTask?: () => void | Promise<void>;
  loading?: boolean;
}

export function NodeExecutionDetailsCard({
  nodes,
  selectedNodeId,
  selectedTaskDetail,
  onReviewTask,
  onRetryTask,
  loading,
}: NodeExecutionDetailsCardProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    setTabIndex(0);
    setIsRetrying(false);
  }, [selectedNodeId]);

  const handleRetry = async () => {
    if (!onRetryTask) return;
    setIsRetrying(true);
    try {
      await onRetryTask();
    } finally {
      setIsRetrying(false);
    }
  };

  const selectedNode = nodes.find((node) => node.nodeClientId === selectedNodeId) ?? null;
  const selectedTask = selectedTaskDetail?.task ?? null;
  const selectedTaskExecution = selectedTaskDetail?.taskExecution ?? null;
  const selectedNodeConfiguration = selectedTaskDetail?.nodeConfiguration ?? null;

  const nodeStatusById = useMemo(() => new Map(nodes.map((node) => [node.nodeClientId, node.status])), [nodes]);
  const selectedNodeConnections = useMemo(() => selectedNode?.outgoingConnections ?? [], [selectedNode]);

  const isReviewableNode =
    !!selectedNode &&
    isUserTaskType(selectedNode.nodeType) &&
    selectedNode.status === 'in_progress' &&
    !!selectedNode.userTaskExecutionId;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {!selectedNode && (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <Typography fontSize={13} color="text.secondary">
              {loading ? 'Loading execution details...' : 'Select a workflow node to view execution details.'}
            </Typography>
          </Box>
        )}

        {selectedNode && (
          <>
            {loading && (
              <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
                <CircularProgress size={14} />
                <Typography fontSize={12} color="text.secondary">
                  Loading task details...
                </Typography>
              </Box>
            )}

            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5} gap={1}>
              <Box>
                <Typography fontSize={14} fontWeight={700}>
                  {selectedNode.nodeName || `${selectedNode.nodeType} Node`}
                </Typography>
                <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: MONO }}>
                  {selectedNode.nodeType} • {selectedNode.nodeClientId}
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                {selectedNode.status === 'failed' && onRetryTask && (
                  <Button disabled={isRetrying} size="small" variant="outlined" color="warning" onClick={handleRetry} sx={{ borderRadius: '8px', fontWeight: 600 }}>
                    {isRetrying && <CircularProgress size={14} color="inherit" sx={{ mr: 1 }} />}
                    Retry Task
                  </Button>
                )}
                {isReviewableNode && onReviewTask && (
                  <Button size="small" variant="contained" onClick={onReviewTask} sx={{ borderRadius: '8px', fontWeight: 600 }}>
                    Review Task
                  </Button>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, rowGap: 1.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} mb={0.25}>STATUS</Typography>
                <Typography fontSize={12} sx={{ fontFamily: MONO, color: getStatusColor(selectedNode.status) }}>{selectedNode.status}</Typography>
              </Box>
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} mb={0.25}>TASK STATUS</Typography>
                <Typography fontSize={12} sx={{ fontFamily: MONO }}>{selectedTask?.status ?? '-'}</Typography>
              </Box>
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} mb={0.25}>TASK ID</Typography>
                <Typography fontSize={12} sx={{ fontFamily: MONO }}>{selectedTask?.id ?? '-'}</Typography>
              </Box>
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} mb={0.25}>STARTED</Typography>
                <Typography fontSize={12}>{formatTimestamp(selectedNode.startTime)}</Typography>
              </Box>
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} mb={0.25}>ENDED</Typography>
                <Typography fontSize={12}>{formatTimestamp(selectedNode.endTime)}</Typography>
              </Box>
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} mb={0.25}>DURATION</Typography>
                <Typography fontSize={12} sx={{ fontFamily: MONO }}>{formatDuration(selectedNode.startTime, selectedNode.endTime)}</Typography>
              </Box>
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} mb={0.25}>TASK CREATED</Typography>
                <Typography fontSize={12}>{formatTimestamp(selectedTask?.createdAt ?? null)}</Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 1.5 }}>
              <Typography fontSize={12} color="text.secondary" fontWeight={600} mb={0.75}>Branch Connections</Typography>

              {selectedNodeConnections.length === 0 && (
                <Typography fontSize={12} color="text.secondary">No outgoing connections.</Typography>
              )}

              {selectedNodeConnections.length > 0 && (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selectedNodeConnections.map((connection) => {
                    const destinationStatus = connection.destinationNodeClientId
                      ? nodeStatusById.get(connection.destinationNodeClientId)
                      : undefined;
                    const isExecutedConnection =
                      selectedNode.status !== 'pending' &&
                      destinationStatus !== undefined &&
                      destinationStatus !== 'pending';

                    return (
                      <Chip
                        key={`${selectedNode.nodeClientId}-${connection.destinationNodeClientId ?? 'end'}-${connection.conditionExpression ?? 'default'}`}
                        size="small"
                        label={`${selectedNode.nodeClientId} -> ${connection.destinationNodeClientId ?? 'end'}${connection.conditionExpression ? ` [${connection.conditionExpression}]` : ''}`}
                        sx={{
                          height: 22,
                          fontSize: 11,
                          fontFamily: MONO,
                          opacity: isExecutedConnection ? 1 : 0.45,
                          borderColor: isExecutedConnection ? '#22c55e' : 'divider',
                          color: isExecutedConnection ? '#166534' : 'text.secondary',
                        }}
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              )}
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
              <Tabs value={tabIndex} onChange={(_, nv) => setTabIndex(nv)} sx={{ minHeight: 40 }}>
                <Tab label="Execution Data" sx={{ minHeight: 40, py: 1, fontSize: 13, textTransform: 'none', fontWeight: 600 }} />
                <Tab label="Configuration" sx={{ minHeight: 40, py: 1, fontSize: 13, textTransform: 'none', fontWeight: 600 }} />
              </Tabs>
            </Box>

            {tabIndex === 0 && (
              <Box sx={{ pt: 1.5 }}>
                {!loading && !selectedTaskExecution && (
                  <Typography fontSize={12} color="text.secondary" mb={1}>
                    No execution variables available for this node yet.
                  </Typography>
                )}
                <JsonDisplay
                  title="Input Variables"
                  data={selectedTaskExecution?.inputVariables ?? null}
                />
                <JsonDisplay
                  title="Output Variables"
                  data={selectedTaskExecution?.outputVariables ?? null}
                />
              </Box>
            )}

            {tabIndex === 1 && (
              <Box sx={{ pt: 1.5 }}>
                <NodeConfigurationDisplay
                  nodeType={selectedNode.nodeType}
                  config={selectedNodeConfiguration}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
}
