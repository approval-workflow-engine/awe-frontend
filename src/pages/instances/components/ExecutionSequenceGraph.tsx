import { memo, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import {
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';
import type { ExecutionNode } from '../../../api/schemas/instance';
import NodeIcon from '../../workflows/builder/config/shared/NodeIcon';
import {
  getNodeColor,
  getNodeTypeLabel,
} from '../../workflows/builder/utils/nodeHelpers';

const MONO = "'JetBrains Mono', monospace";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;
const HORIZONTAL_GAP = 24;
const VERTICAL_GAP = 38;

type GraphNodeData = {
  builderNodeType: string;
  nodeColor: string;
  nodeTypeLabel: string;
  nodeName: string;
  status: ExecutionNode['status'];
  selected: boolean;
};

type PositionedNode = {
  node: ExecutionNode;
  x: number;
  y: number;
};

type GraphEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  conditionExpression: string | null;
};

function getStatusColor(status: ExecutionNode['status']) {
  switch (status) {
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

function toBuilderNodeType(nodeType: string): string {
  switch (nodeType) {
    case 'user':
      return 'user_task';
    case 'service':
      return 'service_task';
    case 'email':
      return 'email_task';
    case 'decision':
      return 'exclusive_gateway';
    case 'script':
      return 'script_task';
    default:
      return nodeType;
  }
}

const ExecutionStatusNode = memo(function ExecutionStatusNode({
  data,
}: NodeProps<Node<GraphNodeData>>) {
  const statusColor = getStatusColor(data.status);

  return (
    <Box
      sx={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        borderRadius: '12px',
        border: data.selected ? '2.4px solid' : '2px solid',
        borderColor: statusColor,
        backgroundColor: 'background.paper',
        boxShadow: data.selected
          ? `0 0 0 3px ${statusColor}2e, 0 0 18px ${statusColor}35, 0 10px 24px rgba(0,0,0,0.16)`
          : `0 0 0 1px ${statusColor}4a, 0 0 10px ${statusColor}22, 0 2px 8px rgba(0,0,0,0.07)`,
        px: 1,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        position: 'relative',
        opacity: data.status === 'pending' ? 0.72 : 1,
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: '8px',
          background: `linear-gradient(145deg, ${data.nodeColor} 0%, ${data.nodeColor}cc 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 3px 8px ${data.nodeColor}50`,
        }}
      >
        <NodeIcon
          type={data.builderNodeType}
          color="#fff"
          isFailureEnd={
            data.builderNodeType === 'end' &&
            (data.status === 'failed' || data.status === 'terminated')
          }
        />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: 'text.primary',
            lineHeight: 1.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.nodeName}
        </Typography>
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: 9,
            color: statusColor,
            textTransform: 'uppercase',
            letterSpacing: 0.07,
            lineHeight: 1.2,
            mt: 0.15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.nodeTypeLabel}
        </Typography>
      </Box>

      <Handle id="target-top" type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle id="source-bottom" type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle id="source-left" type="source" position={Position.Left} style={{ opacity: 0 }} />
      <Handle id="source-right" type="source" position={Position.Right} style={{ opacity: 0 }} />
    </Box>
  );
});

const nodeTypes: NodeTypes = {
  statusNode: ExecutionStatusNode,
};

interface ExecutionSequenceGraphProps {
  nodes: ExecutionNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export function ExecutionSequenceGraph({
  nodes,
  selectedNodeId,
  onSelectNode,
}: ExecutionSequenceGraphProps) {
  const layout = useMemo(() => {
    const nodeById = new Map(nodes.map((node) => [node.nodeClientId, node]));
    const incomingEdgeCount = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    const allEdges: GraphEdge[] = [];

    for (const node of nodes) {
      incomingEdgeCount.set(node.nodeClientId, 0);
      adjacency.set(node.nodeClientId, []);
    }

    for (const node of nodes) {
      for (const connection of node.outgoingConnections) {
        const destinationId = connection.destinationNodeClientId;
        if (!destinationId || !nodeById.has(destinationId)) {
          continue;
        }

        adjacency.get(node.nodeClientId)?.push(destinationId);
        incomingEdgeCount.set(
          destinationId,
          (incomingEdgeCount.get(destinationId) ?? 0) + 1,
        );

        allEdges.push({
          id: `${node.nodeClientId}-${destinationId}-${connection.conditionExpression ?? 'default'}`,
          sourceId: node.nodeClientId,
          targetId: destinationId,
          conditionExpression: connection.conditionExpression,
        });
      }
    }

    const dagreGraph = new dagre.graphlib.Graph({ multigraph: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: 'TB',
      ranker: 'network-simplex',
      nodesep: 56,
      ranksep: 84,
      edgesep: 34,
      marginx: 8,
      marginy: 8,
    });

    for (const node of nodes) {
      dagreGraph.setNode(node.nodeClientId, {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    }

    for (const edge of allEdges) {
      dagreGraph.setEdge(
        edge.sourceId,
        edge.targetId,
        {
          weight: 1,
          minlen: 1,
        },
        edge.id,
      );
    }

    dagre.layout(dagreGraph);

    const positionedNodes: PositionedNode[] = nodes.map((node, index) => {
      const layoutNode = dagreGraph.node(node.nodeClientId) as
        | { x: number; y: number }
        | undefined;

      if (
        layoutNode &&
        Number.isFinite(layoutNode.x) &&
        Number.isFinite(layoutNode.y)
      ) {
        return {
          node,
          x: layoutNode.x - NODE_WIDTH / 2,
          y: layoutNode.y - NODE_HEIGHT / 2,
        };
      }

      return {
        node,
        x: (index % 4) * (NODE_WIDTH + HORIZONTAL_GAP),
        y: Math.floor(index / 4) * (NODE_HEIGHT + VERTICAL_GAP),
      };
    });

    const minX = positionedNodes.reduce(
      (minimum, item) => Math.min(minimum, item.x),
      Number.POSITIVE_INFINITY,
    );
    const minY = positionedNodes.reduce(
      (minimum, item) => Math.min(minimum, item.y),
      Number.POSITIVE_INFINITY,
    );

    const normalizedXOffset = Number.isFinite(minX) ? Math.max(0, -minX) + 10 : 10;
    const normalizedYOffset = Number.isFinite(minY) ? Math.max(0, -minY) + 10 : 10;

    const normalizedPositionedNodes: PositionedNode[] = positionedNodes.map((item) => ({
      node: item.node,
      x: item.x + normalizedXOffset,
      y: item.y + normalizedYOffset,
    }));

    const positionedByNodeId = new Map(
      normalizedPositionedNodes.map((item) => [item.node.nodeClientId, item]),
    );

    const graphNodes: Node<GraphNodeData>[] = normalizedPositionedNodes.map((item) => {
      const builderNodeType = toBuilderNodeType(item.node.nodeType);
      const nodeTypeLabel = getNodeTypeLabel(builderNodeType);
      const nodeColor = getNodeColor(builderNodeType);

      return {
        id: item.node.nodeClientId,
        type: 'statusNode',
        position: { x: item.x, y: item.y },
        data: {
          builderNodeType,
          nodeColor,
          nodeTypeLabel,
          nodeName: item.node.nodeName || `${nodeTypeLabel} Node`,
          status: item.node.status,
          selected: item.node.nodeClientId === selectedNodeId,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        draggable: false,
        selectable: false,
      };
    });

    const visibleEdges = allEdges.filter(
      (edge) =>
        positionedByNodeId.has(edge.sourceId) &&
        positionedByNodeId.has(edge.targetId),
    );

    const outgoingBySourceId = new Map<string, GraphEdge[]>();
    const incomingByTargetId = new Map<string, GraphEdge[]>();

    for (const edge of visibleEdges) {
      const existing = outgoingBySourceId.get(edge.sourceId) ?? [];
      existing.push(edge);
      outgoingBySourceId.set(edge.sourceId, existing);

      const existingIncoming = incomingByTargetId.get(edge.targetId) ?? [];
      existingIncoming.push(edge);
      incomingByTargetId.set(edge.targetId, existingIncoming);
    }

    for (const edgesFromSource of outgoingBySourceId.values()) {
      edgesFromSource.sort((leftEdge, rightEdge) => {
        const leftPosition = positionedByNodeId.get(leftEdge.targetId);
        const rightPosition = positionedByNodeId.get(rightEdge.targetId);

        if (leftPosition && rightPosition && leftPosition.x !== rightPosition.x) {
          return leftPosition.x - rightPosition.x;
        }
        if (leftPosition && rightPosition && leftPosition.y !== rightPosition.y) {
          return leftPosition.y - rightPosition.y;
        }

        return leftEdge.id.localeCompare(rightEdge.id);
      });
    }

    for (const edgesToTarget of incomingByTargetId.values()) {
      edgesToTarget.sort((leftEdge, rightEdge) => {
        const leftPosition = positionedByNodeId.get(leftEdge.sourceId);
        const rightPosition = positionedByNodeId.get(rightEdge.sourceId);

        if (leftPosition && rightPosition && leftPosition.x !== rightPosition.x) {
          return leftPosition.x - rightPosition.x;
        }
        if (leftPosition && rightPosition && leftPosition.y !== rightPosition.y) {
          return leftPosition.y - rightPosition.y;
        }

        return leftEdge.id.localeCompare(rightEdge.id);
      });
    }

    const graphEdges: Edge[] = visibleEdges.map((edge) => {
      const sourceSiblings = outgoingBySourceId.get(edge.sourceId) ?? [edge];
      const targetSiblings = incomingByTargetId.get(edge.targetId) ?? [edge];

      const sourceExecutionNode = nodeById.get(edge.sourceId);
      const targetExecutionNode = nodeById.get(edge.targetId);
      const sourceBuilderType = toBuilderNodeType(
        sourceExecutionNode?.nodeType ?? '',
      );
      const isDecisionSource = sourceBuilderType === 'exclusive_gateway';
      const hasDecisionBranches =
        isDecisionSource && sourceSiblings.length > 1;
      const isNotChosenEdge =
        isDecisionSource &&
        sourceExecutionNode?.status === 'completed' &&
        targetExecutionNode?.status === 'discarded';

      const sourceSiblingIndex = sourceSiblings.findIndex(
        (item) => item.id === edge.id,
      );
      const targetSiblingIndex = targetSiblings.findIndex(
        (item) => item.id === edge.id,
      );

      const sourceCenterIndex = (sourceSiblings.length - 1) / 2;
      const targetCenterIndex = (targetSiblings.length - 1) / 2;
      const sourceLane = sourceSiblingIndex - sourceCenterIndex;
      const targetLane = targetSiblingIndex - targetCenterIndex;

      let sourceHandle = 'source-bottom';
      const targetHandle = 'target-top';
      let branchLaneOffset = 0;

      if (hasDecisionBranches) {
        const shouldUseLeftSide = sourceSiblingIndex <= sourceCenterIndex;
        sourceHandle = shouldUseLeftSide ? 'source-left' : 'source-right';
        branchLaneOffset = shouldUseLeftSide
          ? sourceCenterIndex - sourceSiblingIndex
          : sourceSiblingIndex - sourceCenterIndex;
      }

      const laneSeparation = Math.abs(sourceLane - targetLane);
      const spreadScore = hasDecisionBranches
        ? branchLaneOffset + Math.abs(targetLane) * 0.65 + laneSeparation * 0.5
        : Math.abs(sourceLane) * 0.5 + Math.abs(targetLane) + laneSeparation;
      const offsetBase = hasDecisionBranches ? 30 : 22;
      const maxOffsetBoost = hasDecisionBranches ? 62 : 44;
      const offset = offsetBase + Math.min(spreadScore * 16, maxOffsetBoost);
      const edgeLabel = isNotChosenEdge
        ? edge.conditionExpression
          ? `✕ ${edge.conditionExpression}`
          : '✕'
        : edge.conditionExpression ?? undefined;

      return {
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        sourceHandle,
        targetHandle,
        type: 'smoothstep',
        pathOptions: {
          borderRadius: 14,
          offset,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isNotChosenEdge ? '#ef4444' : '#64748b',
          width: 16,
          height: 16,
        },
        style: {
          stroke: isNotChosenEdge ? '#ef4444' : '#94a3b8',
          strokeWidth: 1.4,
          strokeDasharray: isNotChosenEdge ? '5 3' : undefined,
        },
        label: edgeLabel,
        labelStyle: {
          fontFamily: MONO,
          fontSize: 10,
          fill: isNotChosenEdge ? '#b91c1c' : '#64748b',
          fontWeight: isNotChosenEdge ? 700 : 500,
        },
        labelBgPadding: [3, 2],
        labelBgBorderRadius: 4,
        labelBgStyle: {
          fill: isNotChosenEdge ? 'rgba(254,226,226,0.95)' : 'rgba(248,250,252,0.95)',
          color: isNotChosenEdge ? '#b91c1c' : '#64748b',
        },
      };
    });

    const graphHeight = normalizedPositionedNodes.reduce(
      (maximum, item) => Math.max(maximum, item.y + NODE_HEIGHT),
      0,
    ) + 28;

    const viewportHeight = Math.min(Math.max(graphHeight, 320), 560);

    return {
      graphNodes,
      graphEdges,
      graphHeight,
      viewportHeight,
    };
  }, [nodes, selectedNodeId]);

  if (nodes.length === 0) {
    return (
      <Box
        sx={{
          py: 4,
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
    );
  }

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        height: '100%',
        minHeight: 320,
        backgroundColor: 'background.default',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: layout.viewportHeight,
        }}
      >
        <ReactFlow
          nodes={layout.graphNodes}
          edges={layout.graphEdges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => onSelectNode(node.id)}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}

          zoomOnDoubleClick={false}
          selectionOnDrag={false}
          nodesFocusable={false}
          edgesFocusable={false}
          fitView
          fitViewOptions={{
            padding: 0.1,
            includeHiddenNodes: false,
            minZoom: 0.45,
            maxZoom: 1.4,
          }}
        //   minZoom={0.4}
          maxZoom={1.2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(148,163,184,0.2)" gap={16} size={1} />
        </ReactFlow>
      </Box>
    </Box>
  );
}
