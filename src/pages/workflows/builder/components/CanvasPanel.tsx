import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  type CanvasNode,
  type CanvasEdge,
  type SelectedItem,
  NODE_WIDTH,
  NODE_MIN_HEIGHT,
} from "../type/types";
import {
  getNodeTypeLabel,
  generateId,
  getOutputPorts,
  portYFraction,
  estimateCardHeight,
  calculateNodePosition,
  cleanupStaleEntries,
} from "../utils/nodeHelpers";
import EdgePath from "./canvas/EdgePath";
import NodeCard from "./canvas/NodeCard";

const CANVAS_W = 3200;
const CANVAS_H = 2000;

interface CanvasPanelProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedItem: SelectedItem;
  connectingFrom: { nodeId: string; portId: string } | null;
  errorNodeIds?: Set<string>;
  readOnlyMode?: boolean;
  onUpdateNode: (id: string, updates: Partial<CanvasNode>) => void;
  onAddNode: (node: CanvasNode) => void;
  onAddEdge: (edge: CanvasEdge) => void;
  onSelectItem: (item: SelectedItem) => void;
  onStartConnect: (nodeId: string, portId: string) => void;
  onCancelConnect: () => void;
  onBeginHistoryBatch?: () => void;
  onEndHistoryBatch?: () => void;
}

export default function CanvasPanel({
  nodes,
  edges,
  selectedItem,
  connectingFrom,
  errorNodeIds,
  readOnlyMode = false,
  onUpdateNode,
  onAddNode,
  onAddEdge,
  onSelectItem,
  onStartConnect,
  onCancelConnect,
  onBeginHistoryBatch,
  onEndHistoryBatch,
}: CanvasPanelProps) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visualNodePositions, setVisualNodePositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const dragRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [connError, setConnError] = useState("");
  const connErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragMousePos, setDragMousePos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const getEffectiveNodes = useMemo(() => {
    if (!readOnlyMode || Object.keys(visualNodePositions).length === 0)
      return nodes;

    return nodes.map((node) => {
      const visualPos = visualNodePositions[node.id];
      return visualPos && (visualPos.x !== node.x || visualPos.y !== node.y)
        ? { ...node, x: visualPos.x, y: visualPos.y }
        : node; // Return original object if no change
    });
  }, [nodes, visualNodePositions, readOnlyMode]);

  const nodeMap = useMemo(
    () => new Map(getEffectiveNodes.map((n) => [n.id, n])),
    [getEffectiveNodes],
  );

  useEffect(() => {
    if (readOnlyMode) {
      const nodeIds = new Set(nodes.map((n) => n.id));
      setVisualNodePositions((prev) => cleanupStaleEntries(prev, nodeIds));
    }
  }, [nodes, readOnlyMode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelConnect();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancelConnect]);

  useEffect(() => {
    return () => {
      if (connErrorTimerRef.current) clearTimeout(connErrorTimerRef.current);
    };
  }, []);

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if (connectingFrom) return;
      e.preventDefault();

      const node = nodeMap.get(nodeId);
      if (!node) return;

      if (!readOnlyMode) {
        onBeginHistoryBatch?.();
      }

      dragRef.current = {
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        origX: node.x,
        origY: node.y,
      };
    },
    [connectingFrom, nodeMap, onBeginHistoryBatch, readOnlyMode],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragRef.current) {
        const { nodeId, startX, startY, origX, origY } = dragRef.current;
        const { x: newX, y: newY } = calculateNodePosition(
          origX,
          origY,
          e.clientX - startX,
          e.clientY - startY,
        );

        if (readOnlyMode) {
          setVisualNodePositions((prev) => ({
            ...prev,
            [nodeId]: { x: newX, y: newY },
          }));
        } else {
          onUpdateNode(nodeId, { x: newX, y: newY });
        }
      }

      if (connectingFrom && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDragMousePos({
          x: e.clientX - rect.left + containerRef.current.scrollLeft,
          y: e.clientY - rect.top + containerRef.current.scrollTop,
        });
      }
    },
    [connectingFrom, onUpdateNode, readOnlyMode],
  );

  const handleMouseUp = useCallback(() => {
    const hadDrag = !!dragRef.current;
    dragRef.current = null;
    setDragMousePos(null);
    if (connectingFrom) onCancelConnect();
    if (hadDrag && !readOnlyMode) {
      onEndHistoryBatch?.();
    }
  }, [connectingFrom, onCancelConnect, onEndHistoryBatch, readOnlyMode]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (readOnlyMode) return;

      const nodeType = e.dataTransfer.getData("builder/node-type");
      if (!nodeType || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const rawX =
        e.clientX -
        rect.left +
        containerRef.current.scrollLeft -
        NODE_WIDTH / 2;
      const rawY =
        e.clientY -
        rect.top +
        containerRef.current.scrollTop -
        NODE_MIN_HEIGHT / 2;
      const { x, y } = calculateNodePosition(0, 0, rawX, rawY);

      onAddNode({
        id: generateId(nodeType),
        type: nodeType,
        label: getNodeTypeLabel(nodeType),
        config: {},
        x,
        y,
      });
    },
    [onAddNode, readOnlyMode],
  );

  const handleDropConnect = useCallback(
    (targetId: string) => {
      if (!connectingFrom || connectingFrom.nodeId === targetId) {
        onCancelConnect();
        return;
      }

      const srcNode = nodeMap.get(connectingFrom.nodeId);
      const portId = connectingFrom.portId;

      let isDefault = false;
      if (srcNode?.type === "exclusive_gateway") {
        const defaultRule = srcNode.config.defaultRule as
          | { id?: string }
          | undefined;
        const defaultPortId = defaultRule?.id ?? "default";
        isDefault = portId === defaultPortId;
      }

      onAddEdge({
        id: generateId("edge"),
        source: connectingFrom.nodeId,
        target: targetId,
        sourcePort: portId,
        condition: "",
        isDefault,
      });
      onCancelConnect();
    },
    [connectingFrom, onAddEdge, onCancelConnect, nodeMap],
  );

  const handleStartConnect = useCallback(
    (nodeId: string, portId: string) => {
      if (readOnlyMode) return;

      const sourceNode = nodeMap.get(nodeId);
      const isGateway = sourceNode?.type === "exclusive_gateway";

      if (isGateway) {
        if (edges.some((e) => e.source === nodeId && e.sourcePort === portId)) {
          setConnError("This branch already has a connection.");
          if (connErrorTimerRef.current)
            clearTimeout(connErrorTimerRef.current);
          connErrorTimerRef.current = setTimeout(() => setConnError(""), 3000);
          return;
        }
      } else {
        if (edges.some((e) => e.source === nodeId)) {
          setConnError(
            "This node already has an outgoing connection. Use a Gateway node to create multiple branches.",
          );
          if (connErrorTimerRef.current)
            clearTimeout(connErrorTimerRef.current);
          connErrorTimerRef.current = setTimeout(() => setConnError(""), 3000);
          return;
        }
      }
      setConnError("");
      onStartConnect(nodeId, portId);
    },
    [edges, onStartConnect, readOnlyMode, nodeMap],
  );

  const previewPath = (() => {
    if (!connectingFrom || !dragMousePos) return null;
    const srcNode = nodeMap.get(connectingFrom.nodeId);
    if (!srcNode) return null;
    const ports = getOutputPorts(srcNode);
    const portIdx = Math.max(
      0,
      ports.findIndex((p) => p.id === connectingFrom.portId),
    );
    const srcH = estimateCardHeight();
    const ex = srcNode.x + NODE_WIDTH;
    const ey = srcNode.y + srcH * portYFraction(portIdx, ports.length);
    const tx = dragMousePos.x;
    const ty = dragMousePos.y;
    const dx = Math.max(60, Math.abs(tx - ex) * 0.5);
    return `M${ex},${ey} C${ex + dx},${ey} ${tx - dx},${ty} ${tx},${ty}`;
  })();

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        overflow: "auto",
        position: "relative",
        backgroundColor: "background.default",
        cursor: connectingFrom ? "crosshair" : "default",
        userSelect: connectingFrom ? "none" : "auto",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={handleDrop}
      onClick={() => {
        if (connectingFrom) {
          onCancelConnect();
          return;
        }
        onSelectItem(null);
      }}
    >
      {connError && (
        <Box
          sx={{
            position: "sticky",
            top: connectingFrom ? 36 : 0,
            left: 0,
            right: 0,
            zIndex: 99,
            backgroundColor: "rgba(239,68,68,0.9)",
            backdropFilter: "blur(8px)",
            py: 0.75,
            px: 2,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>
            {connError}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          position: "relative",
          width: CANVAS_W,
          height: CANVAS_H,
          backgroundImage: `radial-gradient(circle, ${theme.palette.divider} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      >
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: CANVAS_W,
            height: CANVAS_H,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={theme.palette.divider} />
            </marker>
            <marker
              id="arrowhead-selected"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#4f6ef7" />
            </marker>
          </defs>
          {edges.map((edge) => (
            <EdgePath
              key={edge.id}
              edge={edge}
              nodes={getEffectiveNodes}
              isSelected={
                selectedItem?.type === "edge" && selectedItem.id === edge.id
              }
              onClick={(e) => {
                e.stopPropagation();
                onSelectItem({ id: edge.id, type: "edge" });
              }}
            />
          ))}

          {previewPath && (
            <path
              d={previewPath}
              fill="none"
              stroke="#4f6ef7"
              strokeWidth={1.5}
              strokeDasharray="6,4"
              opacity={0.7}
            />
          )}
        </svg>

        {getEffectiveNodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            isSelected={
              selectedItem?.type === "node" && selectedItem.id === node.id
            }
            hasError={errorNodeIds?.has(node.id) ?? false}
            isConnectingFrom={
              connectingFrom?.nodeId === node.id ? connectingFrom.portId : false
            }
            connectingMode={!!connectingFrom}
            onSelect={() => onSelectItem({ id: node.id, type: "node" })}
            onStartConnect={(portId) => handleStartConnect(node.id, portId)}
            onDropConnect={() => handleDropConnect(node.id)}
            onDragStart={(e) => handleNodeMouseDown(e, node.id)}
          />
        ))}
      </Box>
    </Box>
  );
}
