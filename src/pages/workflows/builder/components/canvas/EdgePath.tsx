import React from 'react';
import { useTheme } from '@mui/material/styles';
import { type CanvasEdge, type CanvasNode, NODE_WIDTH } from '../../type/types';
import {
  getOutputPorts,
  portYFraction,
  estimateCardHeight,
} from '../../utils/nodeHelpers';

interface EdgePathProps {
  edge: CanvasEdge;
  nodes: CanvasNode[];
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const EdgePath = React.memo(function EdgePath({ edge, nodes, isSelected, onClick }: EdgePathProps) {
  const theme = useTheme();
  const src = nodes.find((n) => n.id === edge.source);
  const tgt = nodes.find((n) => n.id === edge.target);
  if (!src || !tgt) return null;

  const srcPorts = getOutputPorts(src);

  let portIdx: number;
  if (edge.isDefault) {
    portIdx = Math.max(0, srcPorts.length - 1);
  } else {
    const idx = srcPorts.findIndex((p) => p.id === edge.sourcePort);
    portIdx = idx >= 0 ? idx : 0;
  }

  const srcH = estimateCardHeight();
  const tgtH = estimateCardHeight();

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
        d={d}
        fill="none"
        stroke={
          isSelected
            ? '#4f6ef7'
            : edge.isDefault
              ? theme.palette.text.secondary
              : theme.palette.divider
        }
        strokeWidth={isSelected ? 2 : 1.5}
        strokeDasharray={edge.isDefault ? '6,4' : undefined}
        markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
      />
      {(edge.condition || portLabel) && (
        <text
          x={midX}
          y={midY - 8}
          textAnchor="middle"
          fill={theme.palette.text.secondary}
          fontSize={10}
          fontFamily="'JetBrains Mono', monospace"
        >
          {edge.condition
            ? edge.condition.length > 28
              ? edge.condition.slice(0, 28) + '…'
              : edge.condition
            : portLabel}
        </text>
      )}
    </g>
  );
});

export default EdgePath;
