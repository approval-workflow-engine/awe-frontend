import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import HttpIcon from '@mui/icons-material/Http';
import CodeIcon from '@mui/icons-material/Code';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { type CanvasNode, type CanvasEdge, type SelectedItem, NODE_WIDTH, NODE_HEIGHT, getEffectiveNodeColor, getNodeTypeLabel, generateId } from './builderTypes';

const CANVAS_W = 3200;
const CANVAS_H = 2000;

//  Node icon map 
function NodeIcon({ type, color, isFailureEnd }: { type: string; color: string; isFailureEnd?: boolean }) {
  const iconStyle = { fontSize: 16, color } as const;
  if (type === 'start')              return <PlayCircleIcon sx={iconStyle} />;
  if (type === 'user_task')          return <PersonIcon sx={iconStyle} />;
  if (type === 'service_task')       return <HttpIcon sx={iconStyle} />;
  if (type === 'script_task')        return <CodeIcon sx={iconStyle} />;
  if (type === 'exclusive_gateway')  return <AltRouteIcon sx={iconStyle} />;
  if (type === 'end')                return isFailureEnd
    ? <WarningAmberIcon sx={iconStyle} />
    : <StopCircleIcon sx={iconStyle} />;
  return <CodeIcon sx={iconStyle} />;
}

//  Canvas Node Card 
interface NodeCardProps {
  node: CanvasNode;
  isSelected: boolean;
  isConnectingFrom: boolean;
  connectingMode: boolean;
  onSelect: () => void;
  onStartConnect: () => void;
  onDropConnect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

function NodeCard({
  node, isSelected, isConnectingFrom, connectingMode,
  onSelect, onStartConnect, onDropConnect, onDragStart,
}: NodeCardProps) {
  const theme = useTheme();
  const color = getEffectiveNodeColor(node);
  const isEnd = node.type === 'end';
  const isStart = node.type === 'start';
  const isFailureEnd = isEnd && !!(node.config.failure as boolean);

  return (
    <Box
      sx={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        display: 'flex',
        alignItems: 'stretch',
        borderRadius: '8px',
        border: `1px solid ${isSelected ? color : theme.palette.divider}`,
        backgroundColor: 'background.paper',
        boxShadow: isSelected
          ? `0 0 0 2px ${color}40, 0 4px 16px ${color}20`
          : isFailureEnd
          ? `0 0 0 1px #ef444440, 0 2px 12px #ef444420`
          : 'none',
        cursor: connectingMode && !isConnectingFrom ? 'crosshair' : 'default',
        userSelect: 'none',
        zIndex: isSelected ? 10 : 5,
        transition: 'border-color 0.12s, box-shadow 0.12s',
        overflow: 'visible',
      }}
      onClick={e => {
        e.stopPropagation();
        if (connectingMode && !isConnectingFrom) {
          onDropConnect();
        } else {
          onSelect();
        }
      }}
      onMouseDown={e => {
        if (!connectingMode) {
          e.stopPropagation();
          onDragStart(e);
        }
      }}
    >
      {/* Color bar */}
      <Box sx={{ width: 4, backgroundColor: color, borderRadius: '8px 0 0 8px', flexShrink: 0 }} />

      {/* Content */}
      <Box sx={{ flex: 1, px: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
        <Box display="flex" alignItems="center" gap={0.75}>
          <NodeIcon type={node.type} color={color} isFailureEnd={isFailureEnd} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.label}
          </Typography>
        </Box>
        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'text.disabled', lineHeight: 1, mt: 0.5 }}>
          {getNodeTypeLabel(node.type)}
        </Typography>
      </Box>

      {/* Input port (left, all except start) */}
      {!isStart && (
        <Box
          sx={{
            position: 'absolute',
            left: -6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: 'background.default',
            border: `2px solid ${theme.palette.divider}`,
            zIndex: 20,
          }}
        />
      )}

      {/* Output port (right, all except end) */}
      {!isEnd && (
        <Box
          onClick={e => { e.stopPropagation(); onStartConnect(); }}
          sx={{
            position: 'absolute',
            right: -6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: isConnectingFrom ? color : 'background.default',
            border: `2px solid ${isConnectingFrom ? color : theme.palette.divider}`,
            cursor: 'crosshair',
            zIndex: 20,
            transition: 'all 0.12s',
            '&:hover': {
              backgroundColor: color,
              borderColor: color,
            },
          }}
        />
      )}
    </Box>
  );
}

//  Edge SVG 
interface EdgePathProps {
  edge: CanvasEdge;
  nodes: CanvasNode[];
  isSelected: boolean;
  onClick: () => void;
}

function EdgePath({ edge, nodes, isSelected, onClick }: EdgePathProps) {
  const theme = useTheme();
  const src = nodes.find(n => n.id === edge.source);
  const tgt = nodes.find(n => n.id === edge.target);
  if (!src || !tgt) return null;

  const sx = src.x + NODE_WIDTH;
  const sy = src.y + NODE_HEIGHT / 2;
  const tx = tgt.x;
  const ty = tgt.y + NODE_HEIGHT / 2;
  const dx = Math.max(60, Math.abs(tx - sx) * 0.5);

  const d = `M${sx},${sy} C${sx + dx},${sy} ${tx - dx},${ty} ${tx},${ty}`;
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Hit area */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={16} />
      {/* Visual path */}
      <path
        d={d}
        fill="none"
        stroke={isSelected ? '#4f6ef7' : (edge.isDefault ? theme.palette.text.secondary : theme.palette.divider)}
        strokeWidth={isSelected ? 2 : 1.5}
        strokeDasharray={edge.isDefault ? '6,4' : undefined}
        markerEnd="url(#arrowhead)"
      />
      {/* Condition label */}
      {edge.condition && (
        <text
          x={midX}
          y={midY - 8}
          textAnchor="middle"
          fill={theme.palette.text.secondary}
          fontSize={10}
          fontFamily="'JetBrains Mono', monospace"
        >
          {edge.condition.length > 30 ? edge.condition.slice(0, 30) + '…' : edge.condition}
        </text>
      )}
    </g>
  );
}

//  Main Canvas Panel 
interface CanvasPanelProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedItem: SelectedItem;
  connectingFrom: string | null;
  onUpdateNode: (id: string, updates: Partial<CanvasNode>) => void;
  onAddNode: (node: CanvasNode) => void;
  onAddEdge: (edge: CanvasEdge) => void;
  onSelectItem: (item: SelectedItem) => void;
  onStartConnect: (nodeId: string) => void;
  onCancelConnect: () => void;
}

export default function CanvasPanel({
  nodes, edges, selectedItem, connectingFrom,
  onUpdateNode, onAddNode, onAddEdge, onSelectItem, onStartConnect, onCancelConnect,
}: CanvasPanelProps) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ nodeId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [connError, setConnError] = useState('');

  //  Keyboard handler 
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelConnect();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancelConnect]);

  //  Drag handlers 
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => {
    if (connectingFrom) return;
    e.preventDefault();
    dragRef.current = { nodeId, startX: e.clientX, startY: e.clientY, origX: nodeX, origY: nodeY };
  }, [connectingFrom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const { nodeId, startX, startY, origX, origY } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    onUpdateNode(nodeId, { x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) });
  }, [onUpdateNode]);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  //  Drop handler (palette → canvas) 
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('builder/node-type');
    if (!nodeType || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollTop = containerRef.current.scrollTop;
    const x = e.clientX - rect.left + scrollLeft - NODE_WIDTH / 2;
    const y = e.clientY - rect.top + scrollTop - NODE_HEIGHT / 2;

    const newNode: CanvasNode = {
      id: generateId(nodeType),
      type: nodeType,
      label: getNodeTypeLabel(nodeType),
      config: {},
      x: Math.max(0, x),
      y: Math.max(0, y),
    };
    onAddNode(newNode);
  }, [onAddNode]);

  //  Connect handler 
  const handleDropConnect = useCallback((targetId: string) => {
    if (!connectingFrom || connectingFrom === targetId) {
      onCancelConnect();
      return;
    }
    const newEdge: CanvasEdge = {
      id: generateId('edge'),
      source: connectingFrom,
      target: targetId,
      condition: '',
      isDefault: false,
    };
    onAddEdge(newEdge);
    onCancelConnect();
  }, [connectingFrom, onAddEdge, onCancelConnect]);

  //  Start-connect guard: non-gateway nodes may only have one outgoing edge 
  const handleStartConnect = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    if (node.type !== 'exclusive_gateway') {
      const hasOutgoing = edges.some(e => e.source === nodeId);
      if (hasOutgoing) {
        setConnError('Only Conditional (gateway) nodes can have multiple outgoing connections.');
        setTimeout(() => setConnError(''), 3000);
        return;
      }
    }
    setConnError('');
    onStartConnect(nodeId);
  }, [nodes, edges, onStartConnect]);

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        overflow: 'auto',
        position: 'relative',
        backgroundColor: 'background.default',
        cursor: connectingFrom ? 'crosshair' : 'default',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => {
        if (connectingFrom) { onCancelConnect(); return; }
        onSelectItem(null);
      }}
    >
      {/* Connect mode banner */}
      {connectingFrom && (
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: 'rgba(79,110,247,0.9)',
            backdropFilter: 'blur(8px)',
            py: 0.75,
            px: 2,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>
            Click a destination node to connect — or press <strong>Escape</strong> to cancel
          </Typography>
        </Box>
      )}

      {/* Single-outgoing edge error banner */}
      {connError && (
        <Box
          sx={{
            position: 'sticky',
            top: connectingFrom ? 36 : 0,
            left: 0,
            right: 0,
            zIndex: 99,
            backgroundColor: 'rgba(239,68,68,0.9)',
            backdropFilter: 'blur(8px)',
            py: 0.75,
            px: 2,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>
            {connError}
          </Typography>
        </Box>
      )}

      {/* Canvas inner */}
      <Box
        sx={{
          position: 'relative',
          width: CANVAS_W,
          height: CANVAS_H,
          // Dot grid background
          backgroundImage: `radial-gradient(circle, ${theme.palette.divider} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      >
        {/* SVG Edge layer */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: 'none', overflow: 'visible' }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={theme.palette.divider} />
            </marker>
          </defs>
          {edges.map(edge => (
            <EdgePath
              key={edge.id}
              edge={edge}
              nodes={nodes}
              isSelected={selectedItem?.type === 'edge' && selectedItem.id === edge.id}
              onClick={() => onSelectItem({ id: edge.id, type: 'edge' })}
            />
          ))}
        </svg>

        {/* Node cards */}
        {nodes.map(node => (
          <NodeCard
            key={node.id}
            node={node}
            isSelected={selectedItem?.type === 'node' && selectedItem.id === node.id}
            isConnectingFrom={connectingFrom === node.id}
            connectingMode={!!connectingFrom}
            onSelect={() => onSelectItem({ id: node.id, type: 'node' })}
            onStartConnect={() => handleStartConnect(node.id)}
            onDropConnect={() => handleDropConnect(node.id)}
            onDragStart={e => handleNodeMouseDown(e, node.id, node.x, node.y)}
          />
        ))}
      </Box>
    </Box>
  );
}
