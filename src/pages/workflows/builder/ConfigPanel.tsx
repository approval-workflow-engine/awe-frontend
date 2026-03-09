import { Box, Typography, IconButton, TextField, Chip, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  type CanvasNode, type CanvasEdge, type SelectedItem, type WorkflowInput,
  getEffectiveNodeColor, getNodeTypeLabel,
} from './builderTypes';
import { getAvailableContext } from './config/context';
import NodeIcon from './config/shared/NodeIcon';
import StartConfig from './config/nodes/StartConfig';
import EndConfig from './config/nodes/EndConfig';
import UserTaskConfig from './config/nodes/UserTaskConfig';
import ServiceTaskConfig from './config/nodes/ServiceTaskConfig';
import ScriptTaskConfig from './config/nodes/ScriptTaskConfig';
import GatewayConfig from './config/nodes/GatewayConfig';

interface Props {
  selectedItem: SelectedItem;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  inputs: WorkflowInput[];
  onClose: () => void;
  onUpdateNode: (id: string, patch: Partial<CanvasNode>) => void;
  onUpdateEdge: (id: string, patch: Partial<CanvasEdge>) => void;
  onDeleteEdge: (id: string) => void;
  onChangeInputs: (inputs: WorkflowInput[]) => void;
  onOpenCodeEditor: () => void;
}

export default function ConfigPanel({
  selectedItem, nodes, edges, inputs,
  onClose, onUpdateNode, onUpdateEdge, onDeleteEdge, onChangeInputs, onOpenCodeEditor,
}: Props) {
  if (!selectedItem) return null;

  /* Edge panel */
  if (selectedItem.type === 'edge') {
    const edge = edges.find(e => e.id === selectedItem.id);
    if (!edge) return null;
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    return (
      <Box sx={{
        width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid', borderColor: 'divider',
        backgroundColor: 'background.paper', overflow: 'hidden',
      }}>
        <Box sx={{
          px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          <Typography sx={{ fontSize: 11, fontWeight: 600, flex: 1 }}>Connection</Typography>
          <IconButton size="small" onClick={onClose} sx={{ p: 0.25 }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box display="flex" alignItems="center" gap={0.75}>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
              {sourceNode?.label ?? edge.source}
            </Typography>
            <ArrowForwardIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
              {targetNode?.label ?? edge.target}
            </Typography>
          </Box>
          <Box
            component="button"
            onClick={() => { onDeleteEdge(edge.id); onClose(); }}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
              background: 'none', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '6px', px: 1, py: 0.75, color: '#ef4444',
              fontSize: 11, fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(239,68,68,0.06)' },
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
            Delete Connection
          </Box>
        </Box>
      </Box>
    );
  }

  /* Node panel */
  const node = nodes.find(n => n.id === selectedItem.id);
  if (!node) return null;

  const accentColor = getEffectiveNodeColor(node);
  const availableContext = getAvailableContext(node.id, nodes, edges, inputs);

  const updateConfig = (newConfig: Record<string, unknown>) =>
    onUpdateNode(node.id, { config: newConfig });

  const renderConfig = () => {
    switch (node.type) {
      case 'start':
        return (
          <StartConfig
            node={node}
            onUpdateConfig={updateConfig}
            onChangeInputs={onChangeInputs}
            availableContext={availableContext}
          />
        );
      case 'end':
        return (
          <EndConfig
            node={node}
            onUpdateConfig={updateConfig}
            availableContext={availableContext}
          />
        );
      case 'user_task':
        return (
          <UserTaskConfig
            node={node}
            onUpdateConfig={updateConfig}
            availableContext={availableContext}
          />
        );
      case 'service_task':
        return (
          <ServiceTaskConfig
            node={node}
            onUpdateConfig={updateConfig}
            availableContext={availableContext}
          />
        );
      case 'script_task':
        return (
          <ScriptTaskConfig
            node={node}
            onUpdateConfig={updateConfig}
            availableContext={availableContext}
            onOpenCodeEditor={onOpenCodeEditor}
          />
        );
      case 'exclusive_gateway':
        return (
          <GatewayConfig
            node={node}
            onUpdateConfig={updateConfig}
            availableContext={availableContext}
            edges={edges}
            onUpdateEdge={onUpdateEdge}
            onDeleteEdge={onDeleteEdge}
          />
        );
      default:
        return (
          <Typography sx={{ fontSize: 11, color: 'text.disabled', fontStyle: 'italic' }}>
            No configuration available for this node type.
          </Typography>
        );
    }
  };

  return (
    <Box sx={{
      width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid', borderColor: 'divider',
      backgroundColor: 'background.paper', overflow: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{
        px: 1.25, py: 0.875, borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0
      }}>
        <NodeIcon type={node.type} color={accentColor} />
        <TextField
          size="small"
          value={node.label}
          onChange={e => onUpdateNode(node.id, { label: e.target.value })}
          variant="standard"
          sx={{
            flex: 1,
            '& .MuiInputBase-root': { fontSize: 12, fontWeight: 600 },
            '& .MuiInput-underline:before': { borderBottom: 'none' },
            '& .MuiInput-underline:hover:before': { borderBottom: '1px solid' },
          }}
          inputProps={{ style: { padding: 0 } }}
        />
        <Tooltip title={getNodeTypeLabel(node.type)}>
          <Chip
            label={getNodeTypeLabel(node.type)}
            size="small"
            sx={{
              fontSize: 9, height: 18, borderRadius: '4px',
              backgroundColor: `${accentColor}18`,
              color: accentColor, border: `1px solid ${accentColor}40`,
            }}
          />
        </Tooltip>
        <IconButton size="small" onClick={onClose} sx={{ p: 0.25, ml: 0.25 }}>
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      {/* Scrollable config content */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {renderConfig()}
      </Box>
    </Box>
  );
}
