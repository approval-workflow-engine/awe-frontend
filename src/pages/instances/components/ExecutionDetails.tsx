import { useMemo } from 'react';
import { Box, Typography, Paper, Chip, Button } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import type { ExecutionNode } from '../../../api/schemas/instance';

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
    default:
      return '#6b7280';
  }
}

function formatDuration(start: string | null, end: string | null): string {
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

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

function JsonDisplay({ title, data }: { title: string; data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) return null;

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
          maxHeight: 320,
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

  return (
    <Paper variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box display="flex" alignItems="center" gap={1} mb={2} flexShrink={0}>
        <TimelineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography fontWeight={700} fontSize={15}>
          Workflow Execution
        </Typography>
        {totalNodes > 0 && (
          <Chip label={`${completedNodes}/${totalNodes} completed`} size="small" sx={{ ml: 1, height: 20, fontSize: 11 }} />
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {loading && (
          <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
            <Typography color="text.secondary" fontSize={13}>Loading execution workflow...</Typography>
          </Box>
        )}

        {!loading && nodes.length === 0 && (
          <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
            <Typography color="text.secondary" fontSize={13}>No workflow tasks found for this instance.</Typography>
          </Box>
        )}

        {!loading && nodes.length > 0 && (
          <Box display="flex" flexDirection="column" gap={1.2}>
            {nodes.map((node) => {
              const isSelected = node.nodeId === selectedNodeId;
              const isReviewable =
                !!currentTaskNodeClientId &&
                node.nodeClientId === currentTaskNodeClientId &&
                isUserTaskType(node.nodeType) &&
                node.status === 'in_progress';

              return (
                <Box
                  key={node.nodeId}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectNode(node.nodeId)}
                  sx={{
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : isReviewable ? '#f97316' : 'divider',
                    backgroundColor: isReviewable ? 'rgba(249,115,22,0.08)' : node.status === 'pending' ? 'action.hover' : 'transparent',
                    borderRadius: 2,
                    p: 1.25,
                    opacity: node.status === 'pending' ? 0.65 : 1,
                    cursor: 'pointer',
                    transition: 'all .2s ease',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', minWidth: 24, textAlign: 'center' }}>
                      {node.order}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(node.status)}
                      <Typography sx={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: getStatusColor(node.status), textTransform: 'uppercase', minWidth: 90 }}>
                        {node.status}
                      </Typography>
                    </Box>

                    <Box flex={1} minWidth={0}>
                      <Typography fontSize={13} fontWeight={600} noWrap>
                        {node.nodeName || `${node.nodeType} Node`}
                      </Typography>
                      <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: MONO }}>
                        {node.nodeType} • {node.nodeClientId}
                      </Typography>
                    </Box>

                    <Box textAlign="right">
                      <Typography fontSize={11} color="text.secondary">
                        {formatDuration(node.startedOn, node.endedOn)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}

            <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
              <Typography fontSize={12} color="text.secondary">
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
  onReviewTask?: () => void;
  loading?: boolean;
}

export function NodeExecutionDetailsCard({
  nodes,
  selectedNodeId,
  onReviewTask,
  loading,
}: NodeExecutionDetailsCardProps) {
  const selectedNode = nodes.find((node) => node.nodeId === selectedNodeId) ?? null;

  const nodeStatusById = useMemo(() => new Map(nodes.map((node) => [node.nodeId, node.status])), [nodes]);
  const selectedNodeConnections = useMemo(() => selectedNode?.outgoingConnections ?? [], [selectedNode]);

  const isReviewableNode =
    !!selectedNode &&
    isUserTaskType(selectedNode.nodeType) &&
    selectedNode.status === 'in_progress' &&
    !!selectedNode.userTaskExecutionId;

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {!selectedNode && (
          <Typography fontSize={12} color="text.secondary">
            {loading ? 'Loading execution details...' : 'Select a workflow node to view execution details.'}
          </Typography>
        )}

        {selectedNode && (
          <>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5} gap={1}>
              <Box>
                <Typography fontSize={14} fontWeight={700}>
                  {selectedNode.nodeName || `${selectedNode.nodeType} Node`}
                </Typography>
                <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: MONO }}>
                  {selectedNode.nodeType} • {selectedNode.nodeClientId}
                </Typography>
              </Box>
              {isReviewableNode && onReviewTask && (
                <Button size="small" variant="contained" onClick={onReviewTask} sx={{ borderRadius: '8px', fontWeight: 600 }}>
                  Review Task
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1.5, py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography fontSize={12} color="text.secondary" fontWeight={600}>Status:</Typography>
              <Typography fontSize={12} sx={{ fontFamily: MONO, color: getStatusColor(selectedNode.status) }}>{selectedNode.status}</Typography>

              <Typography fontSize={12} color="text.secondary" fontWeight={600}>Started:</Typography>
              <Typography fontSize={12}>{formatTimestamp(selectedNode.startedOn)}</Typography>

              <Typography fontSize={12} color="text.secondary" fontWeight={600}>Ended:</Typography>
              <Typography fontSize={12}>{formatTimestamp(selectedNode.endedOn)}</Typography>

              <Typography fontSize={12} color="text.secondary" fontWeight={600}>Duration:</Typography>
              <Typography fontSize={12} sx={{ fontFamily: MONO }}>{formatDuration(selectedNode.startedOn, selectedNode.endedOn)}</Typography>
            </Box>

            <Box sx={{ mt: 1.5 }}>
              <Typography fontSize={12} color="text.secondary" fontWeight={600} mb={0.75}>Branch Connections</Typography>

              {selectedNodeConnections.length === 0 && (
                <Typography fontSize={12} color="text.secondary">No outgoing connections.</Typography>
              )}

              {selectedNodeConnections.length > 0 && (
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selectedNodeConnections.map((connection) => {
                    const destinationStatus = connection.destinationNodeId
                      ? nodeStatusById.get(connection.destinationNodeId)
                      : undefined;
                    const isExecutedConnection =
                      selectedNode.status !== 'pending' &&
                      destinationStatus !== undefined &&
                      destinationStatus !== 'pending';

                    return (
                      <Chip
                        key={`${selectedNode.nodeId}-${connection.destinationNodeId ?? 'end'}-${connection.conditionExpression ?? 'default'}`}
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

            <JsonDisplay title="Input Variables" data={selectedNode.inputVariables} />
            <JsonDisplay title="Output Variables" data={selectedNode.outputVariables} />
          </>
        )}
      </Box>
    </Paper>
  );
}
