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
import {
  type CanvasNode, type CanvasEdge, type SelectedItem,
  NODE_WIDTH, NODE_MIN_HEIGHT,
} from './types';
import {
  getEffectiveNodeColor, getNodeTypeLabel, generateId,
  getOutputPorts, portYFraction, estimateCardHeight,
} from './nodeHelpers';

const CANVAS_W = 3200;
const CANVAS_H = 2000;



function NodeIcon({ type, color, isFailureEnd }: { type: string; color: string; isFailureEnd?: boolean }) {
  const s = { fontSize: 16, color } as const;
  if (type === 'start') return <PlayCircleIcon sx={s} />;
  if (type === 'user_task') return <PersonIcon sx={s} />;
  if (type === 'service_task') return <HttpIcon sx={s} />;
  if (type === 'script_task') return <CodeIcon sx={s} />;
  if (type === 'exclusive_gateway') return <AltRouteIcon sx={s} />;
  if (type === 'end') return isFailureEnd ? <WarningAmberIcon sx={s} /> : <StopCircleIcon sx={s} />;
  return <CodeIcon sx={s} />;
}



interface EdgePathProps {
  edge: CanvasEdge; nodes: CanvasNode[]; isSelected: boolean; onClick: (e: React.MouseEvent) => void;
}

function EdgePath({ edge, nodes, isSelected, onClick }: EdgePathProps) {
  const theme = useTheme();
  const src = nodes.find(n => n.id === edge.source);
  const tgt = nodes.find(n => n.id === edge.target);
  if (!src || !tgt) return null;

  const srcPorts = getOutputPorts(src);

  // Default edges always originate from the last port (the default port).
  // Non-default edges look up their port by sourcePort id; if not found, fall back to 0.
  let portIdx: number;
  if (edge.isDefault) {
    portIdx = Math.max(0, srcPorts.length - 1);
  } else {
    const idx = srcPorts.findIndex(p => p.id === edge.sourcePort);
    portIdx = idx >= 0 ? idx : 0;
  }
  const srcH = estimateCardHeight(src);
  const tgtH = estimateCardHeight(tgt);

  const ex = src.x + NODE_WIDTH;
  const ey = src.y + srcH * portYFraction(portIdx, srcPorts.length);
  const tx = tgt.x;
  const ty = tgt.y + tgtH * 0.5;
  const dx = Math.max(60, Math.abs(tx - ex) * 0.5);

  const d = `M${ex},${ey} C${ex + dx},${ey} ${tx - dx},${ty} ${tx},${ty}`;
  const midX = (ex + tx) / 2;
  const midY = (ey + ty) / 2;
  const portLabel = srcPorts[portIdx]?.label;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer', pointerEvents: 'auto' }}>
      <path d={d} fill="none" stroke="transparent" strokeWidth={16} />
      <path
        d={d} fill="none"
        stroke={isSelected ? '#4f6ef7' : (edge.isDefault ? theme.palette.text.secondary : theme.palette.divider)}
        strokeWidth={isSelected ? 2 : 1.5}
        strokeDasharray={edge.isDefault ? '6,4' : undefined}
        markerEnd="url(#arrowhead)"
      />
      {(edge.condition || portLabel) && (
        <text x={midX} y={midY - 8} textAnchor="middle"
          fill={theme.palette.text.secondary} fontSize={10}
          fontFamily="'JetBrains Mono', monospace"
        >
          {edge.condition
            ? (edge.condition.length > 28 ? edge.condition.slice(0, 28) + '…' : edge.condition)
            : portLabel}
        </text>
      )}
    </g>
  );
}



interface NodeCardProps {
  node: CanvasNode;
  isSelected: boolean;
  isConnectingFrom: string | false;
  connectingMode: boolean;
  onSelect: () => void;
  onStartConnect: (portId: string) => void;
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
  const ports = getOutputPorts(node);

  return (
    <Box
      onMouseDown={e => {
        if (!connectingMode) { e.stopPropagation(); onDragStart(e); }
      }}
      onMouseUp={e => {
        if (connectingMode) { e.stopPropagation(); onDropConnect(); }
      }}
      onClick={e => {
        e.stopPropagation();
        if (!connectingMode) onSelect();
      }}
      sx={{
        position: 'absolute',
        left: node.x, top: node.y,
        width: NODE_WIDTH,
        minHeight: NODE_MIN_HEIGHT,
        borderRadius: '12px',
        border: '1.5px solid',
        borderColor: isSelected ? color : 'divider',
        backgroundColor: 'background.paper',
        boxShadow: isSelected
          ? `0 0 0 3px ${color}28, 0 8px 24px rgba(0,0,0,0.13)`
          : '0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)',
        overflow: 'visible',
        cursor: connectingMode ? 'crosshair' : 'grab',
        zIndex: isSelected ? 10 : 1,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        display: 'flex', alignItems: 'center', gap: 1.25,
        px: 1, py: 1.25,
        '&:active': { cursor: connectingMode ? 'crosshair' : 'grabbing' },
      }}
    >

      <Box sx={{
        width: 34, height: 34, borderRadius: '8px',
        background: `linear-gradient(145deg, ${color} 0%, ${color}cc 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 3px 8px ${color}50`,
      }}>
        <NodeIcon type={node.type} color="#fff" isFailureEnd={isFailureEnd} />
      </Box>


      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{
          fontSize: 12, fontWeight: 600, color: 'text.primary',
          lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {node.label}
        </Typography>
        <Typography sx={{
          fontSize: 9, color: 'text.disabled',
          textTransform: 'uppercase', letterSpacing: '0.07em',
          fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 1.3, mt: 0.25,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {getNodeTypeLabel(node.type)}
        </Typography>
      </Box>


      {!isStart && (
        <Box sx={{
          position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)',
          width: 12, height: 12, borderRadius: '50%',
          backgroundColor: 'background.paper',
          border: `2px solid ${theme.palette.divider}`,
          zIndex: 20, transition: 'all 0.12s',
          '&:hover': { borderColor: color, backgroundColor: `${color}20` },
        }} />
      )}


      {ports.map((port, idx) => (
        <Box key={port.id}>
          {port.label && (
            <Typography sx={{
              position: 'absolute',
              left: 'calc(100% + 14px)',
              top: `${portYFraction(idx, ports.length) * 100}%`,
              transform: 'translateY(-50%)',
              fontSize: 8, color: 'text.disabled', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.04em',
              lineHeight: 1, pointerEvents: 'none', whiteSpace: 'nowrap',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {port.label}
            </Typography>
          )}
          <Box
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onStartConnect(port.id); }}
            sx={{
              position: 'absolute', right: -6,
              top: `${portYFraction(idx, ports.length) * 100}%`,
              transform: 'translateY(-50%)',
              width: 12, height: 12, borderRadius: '50%',
              backgroundColor: isConnectingFrom === port.id ? color : 'background.paper',
              border: `2px solid ${isConnectingFrom === port.id ? color : theme.palette.divider}`,
              cursor: 'crosshair', zIndex: 20, transition: 'all 0.12s',
              '&:hover': { backgroundColor: color, borderColor: color, transform: 'translateY(-50%) scale(1.25)' },
            }}
          />
        </Box>
      ))}
    </Box>
  );
}



interface CanvasPanelProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedItem: SelectedItem;
  connectingFrom: { nodeId: string; portId: string } | null;
  onUpdateNode: (id: string, updates: Partial<CanvasNode>) => void;
  onAddNode: (node: CanvasNode) => void;
  onAddEdge: (edge: CanvasEdge) => void;
  onSelectItem: (item: SelectedItem) => void;
  onStartConnect: (nodeId: string, portId: string) => void;
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
  const [dragMousePos, setDragMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancelConnect(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancelConnect]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => {
    if (connectingFrom) return;
    e.preventDefault();
    dragRef.current = { nodeId, startX: e.clientX, startY: e.clientY, origX: nodeX, origY: nodeY };
  }, [connectingFrom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {

    if (dragRef.current) {
      const { nodeId, startX, startY, origX, origY } = dragRef.current;
      onUpdateNode(nodeId, { x: Math.max(0, origX + e.clientX - startX), y: Math.max(0, origY + e.clientY - startY) });
    }

    if (connectingFrom && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragMousePos({
        x: e.clientX - rect.left + containerRef.current.scrollLeft,
        y: e.clientY - rect.top + containerRef.current.scrollTop,
      });
    }
  }, [connectingFrom, onUpdateNode]);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    setDragMousePos(null);
    if (connectingFrom) onCancelConnect();
  }, [connectingFrom, onCancelConnect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('builder/node-type');
    if (!nodeType || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft - NODE_WIDTH / 2;
    const y = e.clientY - rect.top + containerRef.current.scrollTop - NODE_MIN_HEIGHT / 2;
    onAddNode({
      id: generateId(nodeType), type: nodeType, label: getNodeTypeLabel(nodeType),
      config: {}, x: Math.max(0, x), y: Math.max(0, y),
    });
  }, [onAddNode]);

  const handleDropConnect = useCallback((targetId: string) => {
    if (!connectingFrom || connectingFrom.nodeId === targetId) { onCancelConnect(); return; }

    const srcNode = nodes.find(n => n.id === connectingFrom.nodeId);
    const portId = connectingFrom.portId;

    // Determine if this edge is the default branch of a gateway.
    // The default port is the last entry from getOutputPorts (its id matches defaultRule.id or 'default').
    let isDefault = false;
    if (srcNode?.type === 'exclusive_gateway') {
      const defaultRule = srcNode.config.defaultRule as { id?: string } | undefined;
      const defaultPortId = defaultRule?.id ?? 'default';
      isDefault = portId === defaultPortId;
    }

    onAddEdge({ id: generateId('edge'), source: connectingFrom.nodeId, target: targetId, sourcePort: portId, condition: '', isDefault });
    onCancelConnect();
  }, [connectingFrom, nodes, onAddEdge, onCancelConnect]);

  const handleStartConnect = useCallback((nodeId: string, portId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    const isGateway = sourceNode?.type === 'exclusive_gateway';

    if (isGateway) {
      if (edges.some(e => e.source === nodeId && e.sourcePort === portId)) {
        setConnError('This branch already has a connection.');
        setTimeout(() => setConnError(''), 3000);
        return;
      }
    } else {
      if (edges.some(e => e.source === nodeId)) {
        setConnError('This node already has an outgoing connection. Use a Gateway node to create multiple branches.');
        setTimeout(() => setConnError(''), 3000);
        return;
      }
    }
    setConnError('');
    onStartConnect(nodeId, portId);
  }, [nodes, edges, onStartConnect]);


  const previewPath = (() => {
    if (!connectingFrom || !dragMousePos) return null;
    const srcNode = nodes.find(n => n.id === connectingFrom.nodeId);
    if (!srcNode) return null;
    const ports = getOutputPorts(srcNode);
    const portIdx = Math.max(0, ports.findIndex(p => p.id === connectingFrom.portId));
    const srcH = estimateCardHeight(srcNode);
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
      sx={{ flex: 1, overflow: 'auto', position: 'relative', backgroundColor: 'background.default', cursor: connectingFrom ? 'crosshair' : 'default', userSelect: connectingFrom ? 'none' : 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleDrop}
      onClick={() => { if (connectingFrom) { onCancelConnect(); return; } onSelectItem(null); }}
    >

      {connError && (
        <Box sx={{ position: 'sticky', top: connectingFrom ? 36 : 0, left: 0, right: 0, zIndex: 99, backgroundColor: 'rgba(239,68,68,0.9)', backdropFilter: 'blur(8px)', py: 0.75, px: 2, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{connError}</Typography>
        </Box>
      )}

      <Box sx={{
        position: 'relative', width: CANVAS_W, height: CANVAS_H,
        backgroundImage: `radial-gradient(circle, ${theme.palette.divider} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: 'none', overflow: 'visible' }}>
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={theme.palette.divider} />
            </marker>
          </defs>
          {edges.map(edge => (
            <EdgePath key={edge.id} edge={edge} nodes={nodes}
              isSelected={selectedItem?.type === 'edge' && selectedItem.id === edge.id}
              onClick={e => { e.stopPropagation(); onSelectItem({ id: edge.id, type: 'edge' }); }}
            />
          ))}

          {previewPath && (
            <path d={previewPath} fill="none" stroke="#4f6ef7" strokeWidth={1.5}
              strokeDasharray="6,4" opacity={0.7} />
          )}
        </svg>

        {nodes.map(node => (
          <NodeCard
            key={node.id} node={node}
            isSelected={selectedItem?.type === 'node' && selectedItem.id === node.id}
            isConnectingFrom={connectingFrom?.nodeId === node.id ? connectingFrom.portId : false}
            connectingMode={!!connectingFrom}
            onSelect={() => onSelectItem({ id: node.id, type: 'node' })}
            onStartConnect={portId => handleStartConnect(node.id, portId)}
            onDropConnect={() => handleDropConnect(node.id)}
            onDragStart={e => handleNodeMouseDown(e, node.id, node.x, node.y)}
          />
        ))}
      </Box>
    </Box>
  );
}
