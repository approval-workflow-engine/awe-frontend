import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { type CanvasNode, NODE_WIDTH, NODE_MIN_HEIGHT } from '../../type/types';
import {
  getEffectiveNodeColor,
  getNodeTypeLabel,
  getOutputPorts,
  portYFraction,
} from '../../utils/nodeHelpers';
import NodeIcon from '../../config/shared/NodeIcon';

interface NodeCardProps {
  node: CanvasNode;
  isSelected: boolean;
  hasError: boolean;
  isConnectingFrom: string | false;
  connectingMode: boolean;
  onSelect: () => void;
  onStartConnect: (portId: string) => void;
  onDropConnect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

const NodeCard = React.memo(function NodeCard({
  node,
  isSelected,
  hasError,
  isConnectingFrom,
  connectingMode,
  onSelect,
  onStartConnect,
  onDropConnect,
  onDragStart,
}: NodeCardProps) {
  const theme = useTheme();
  const color = getEffectiveNodeColor(node);
  const isEnd = node.type === 'end';
  const isStart = node.type === 'start';
  const isFailureEnd = isEnd && !!(node.config.failure as boolean);
  const ports = getOutputPorts(node);

  return (
    <Box
      onMouseDown={(e) => {
        if (!connectingMode) {
          e.stopPropagation();
          onDragStart(e);
        }
      }}
      onMouseUp={(e) => {
        if (connectingMode) {
          e.stopPropagation();
          onDropConnect();
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!connectingMode) onSelect();
      }}
      sx={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: NODE_WIDTH,
        minHeight: NODE_MIN_HEIGHT,
        borderRadius: '12px',
        border: '1.5px solid',
        borderColor: isSelected ? color : hasError ? '#ef4444' : 'divider',
        backgroundColor: 'background.paper',
        boxShadow: isSelected
          ? `0 0 0 3px ${color}28, 0 8px 24px rgba(0,0,0,0.13)`
          : hasError
            ? '0 0 0 2px rgba(239,68,68,0.25), 0 2px 8px rgba(0,0,0,0.07)'
            : '0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)',
        overflow: 'visible',
        cursor: connectingMode ? 'crosshair' : 'grab',
        zIndex: isSelected ? 10 : 1,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1,
        py: 1.25,
        '&:active': { cursor: connectingMode ? 'crosshair' : 'grabbing' },
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '8px',
          background: `linear-gradient(145deg, ${color} 0%, ${color}cc 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 3px 8px ${color}50`,
        }}
      >
        <NodeIcon type={node.type} color="#fff" isFailureEnd={isFailureEnd} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: 'text.primary',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {node.label}
        </Typography>
        <Typography
          sx={{
            fontSize: 9,
            color: 'text.disabled',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.3,
            mt: 0.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {getNodeTypeLabel(node.type)}
        </Typography>
      </Box>

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
            backgroundColor: 'background.paper',
            border: `2px solid ${theme.palette.divider}`,
            zIndex: 20,
            transition: 'all 0.12s',
            '&:hover': { borderColor: color, backgroundColor: `${color}20` },
          }}
        />
      )}

      {ports.map((port, idx) => (
        <Box key={port.id}>
          {port.label && (
            <Typography
              sx={{
                position: 'absolute',
                left: 'calc(100% + 14px)',
                top: `${portYFraction(idx, ports.length) * 100}%`,
                transform: 'translateY(-50%)',
                fontSize: 8,
                color: 'text.disabled',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                lineHeight: 1,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {port.label}
            </Typography>
          )}
          <Box
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onStartConnect(port.id);
            }}
            sx={{
              position: 'absolute',
              right: -6,
              top: `${portYFraction(idx, ports.length) * 100}%`,
              transform: 'translateY(-50%)',
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: isConnectingFrom === port.id ? color : 'background.paper',
              border: `2px solid ${isConnectingFrom === port.id ? color : theme.palette.divider}`,
              cursor: 'crosshair',
              zIndex: 20,
              transition: 'all 0.12s',
              '&:hover': {
                backgroundColor: color,
                borderColor: color,
                transform: 'translateY(-50%) scale(1.25)',
              },
            }}
          />
        </Box>
      ))}

      {hasError && (
        <Box
          sx={{
            position: 'absolute',
            top: -7,
            right: -7,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 25,
            boxShadow: '0 1px 4px rgba(239,68,68,0.5)',
            pointerEvents: 'none',
          }}
        >
          <Typography
            sx={{ fontSize: 9, color: '#fff', fontWeight: 700, lineHeight: 1 }}
          >
            !
          </Typography>
        </Box>
      )}
    </Box>
  );
});

export default NodeCard;
