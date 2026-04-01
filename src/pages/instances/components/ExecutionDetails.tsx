import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import type {
  ExecutionNode,
} from '../../../api/schemas/instance';

const MONO = "'JetBrains Mono', monospace";

interface Props {
  executions?: ExecutionNode[];
  loading?: boolean;
}

function getStatusIcon(status: string) {
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

function getStatusColor(status: string) {
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

function getNodeCardStyles(status: string) {
  switch (status) {
    case 'completed':
      return {
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.08)',
        opacity: 1,
      };
    case 'failed':
      return {
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.08)',
        opacity: 1,
      };
    case 'in_progress':
      return {
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6,182,212,0.08)',
        opacity: 1,
      };
    case 'pending':
    default:
      return {
        borderColor: 'divider',
        backgroundColor: 'action.hover',
        opacity: 0.55,
      };
  }
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '—';
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const durationMs = endTime - startTime;

  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(2)}s`;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = ((durationMs % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '—';
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
          maxHeight: 300,
          overflowY: 'auto',
        }}
      >
        {JSON.stringify(data, null, 2)}
      </Box>
    </Box>
  );
}

export default function ExecutionDetails({
  executions,
  loading,
}: Props) {
  const orderedNodes = useMemo(
    () => [...(executions ?? [])].sort((a, b) => a.order - b.order),
    [executions],
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const activeNodeId = useMemo(() => {
    if (orderedNodes.length === 0) {
      return null;
    }

    if (selectedNodeId && orderedNodes.some((node) => node.nodeId === selectedNodeId)) {
      return selectedNodeId;
    }

    const latestExecuted = [...orderedNodes]
      .reverse()
      .find((node) => node.status !== 'pending');

    return latestExecuted?.nodeId ?? orderedNodes[0].nodeId;
  }, [orderedNodes, selectedNodeId]);

  const selectedNode = orderedNodes.find((node) => node.nodeId === activeNodeId) ?? null;

  const selectedNodeConnections = useMemo(() => {
    if (!activeNodeId) return [];
    return (
      orderedNodes.find((node) => node.nodeId === activeNodeId)?.outgoingConnections ?? []
    );
  }, [activeNodeId, orderedNodes]);

  const selectNode = (nodeId: string) => setSelectedNodeId(nodeId);

  const nodeStatusById = useMemo(() => {
    return new Map(orderedNodes.map((node) => [node.nodeId, node.status]));
  }, [orderedNodes]);

  const createNodeKeyDownHandler = (nodeId: string) =>
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectNode(nodeId);
      }
    };

  const totalNodes = orderedNodes.length;
  const completedNodes = orderedNodes.filter((node) => node.status === 'completed').length;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TimelineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography fontWeight={700} fontSize={15}>
          Workflow Execution
        </Typography>
        {totalNodes > 0 && (
          <Chip
            label={`${completedNodes}/${totalNodes} completed`}
            size="small"
            sx={{ ml: 1, height: 20, fontSize: 11 }}
          />
        )}
      </Box>

      {loading && (
        <Box
          sx={{
            py: 6,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary" fontSize={13}>
            Loading execution workflow...
          </Typography>
        </Box>
      )}

      {!loading && orderedNodes.length === 0 && (
        <Box
          sx={{
            py: 6,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary" fontSize={13}>
            No workflow tasks found for this instance.
          </Typography>
        </Box>
      )}

      {!loading && orderedNodes.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.5fr) minmax(320px, 1fr)' },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <Box
            display="flex"
            flexDirection="column"
            gap={1.25}
            sx={{
              maxHeight: { md: 'calc(100vh - 150px)' },
              overflowY: { md: 'auto' },
              pr: { md: 1 },
            }}
          >
            {orderedNodes.map((node) => {
              const cardStyles = getNodeCardStyles(node.status);
              const isSelected = selectedNodeId === node.nodeId;

              return (
                <Box
                  key={node.nodeId}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectNode(node.nodeId)}
                  onKeyDown={createNodeKeyDownHandler(node.nodeId)}
                  sx={{
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : cardStyles.borderColor,
                    backgroundColor: cardStyles.backgroundColor,
                    borderRadius: 2,
                    p: 1.25,
                    opacity: cardStyles.opacity,
                    cursor: 'pointer',
                    transition: 'all .2s ease',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2} flex={1}>
                    <Typography
                      sx={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: 'text.secondary',
                        minWidth: 24,
                        textAlign: 'center',
                      }}
                    >
                      {node.order}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(node.status)}
                      <Typography
                        sx={{
                          fontFamily: MONO,
                          fontSize: 11,
                          fontWeight: 600,
                          color: getStatusColor(node.status),
                          textTransform: 'uppercase',
                          minWidth: 90,
                        }}
                      >
                        {node.status}
                      </Typography>
                    </Box>

                    <Box flex={1}>
                      <Typography fontSize={13} fontWeight={600}>
                        {node.nodeName || `${node.nodeType} Node`}
                      </Typography>
                      <Typography
                        fontSize={11}
                        color="text.secondary"
                        sx={{ fontFamily: MONO }}
                      >
                        {node.nodeType} • {node.nodeClientId}
                      </Typography>
                    </Box>

                    <Box textAlign="right">
                      <Typography fontSize={11} color="text.secondary">
                        {formatDuration(
                          node.startedOn,
                          node.endedOn,
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}

            {orderedNodes.length > 0 && (
              <Box
                sx={{
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <Typography fontSize={12} color="text.secondary">
                  Executions recorded: {orderedNodes.filter((item) => item.status !== 'pending').length}
                </Typography>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              position: { md: 'sticky' },
              top: { md: 16 },
            }}
          >
            {selectedNode ? (
              <>
                <Typography fontSize={14} fontWeight={700} mb={1.25}>
                  {selectedNode.nodeName || `${selectedNode.nodeType} Node`} Details
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: 1.5,
                    py: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                    Node ID:
                  </Typography>
                  <Typography fontSize={12} sx={{ fontFamily: MONO }}>
                    {selectedNode.nodeId}
                  </Typography>

                  <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                    Status:
                  </Typography>
                  <Typography
                    fontSize={12}
                    sx={{ fontFamily: MONO, color: getStatusColor(selectedNode.status) }}
                  >
                    {selectedNode.status}
                  </Typography>

                  <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                    Started:
                  </Typography>
                  <Typography fontSize={12}>
                    {formatTimestamp(selectedNode.startedOn)}
                  </Typography>

                  <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                    Ended:
                  </Typography>
                  <Typography fontSize={12}>
                    {formatTimestamp(selectedNode.endedOn)}
                  </Typography>

                  <Typography fontSize={12} color="text.secondary" fontWeight={600}>
                    Duration:
                  </Typography>
                  <Typography fontSize={12} sx={{ fontFamily: MONO }}>
                    {formatDuration(
                      selectedNode.startedOn,
                      selectedNode.endedOn,
                    )}
                  </Typography>
                </Box>

                <Box sx={{ mt: 1.5 }}>
                  <Typography fontSize={12} color="text.secondary" fontWeight={600} mb={0.75}>
                    Branch Connections
                  </Typography>

                  {selectedNodeConnections.length === 0 && (
                    <Typography fontSize={12} color="text.secondary">
                      No outgoing connections.
                    </Typography>
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
                            label={`${selectedNode.nodeClientId} → ${connection.destinationNodeClientId ?? 'end'}${connection.conditionExpression ? ` [${connection.conditionExpression}]` : ''}`}
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

                <JsonDisplay
                  title="Input Variables"
                  data={selectedNode.inputVariables}
                />
                <JsonDisplay
                  title="Output Variables"
                  data={selectedNode.outputVariables}
                />
              </>
            ) : (
              <Typography fontSize={12} color="text.secondary">
                Select a workflow node to view task details.
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
