import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { CanvasEdge, CanvasNode } from '../../type/types';

interface EdgeConfigSectionProps {
  edge: CanvasEdge;
  nodes: CanvasNode[];
  panelWidth: number;
  onClose: () => void;
  onDeleteEdge: (id: string) => void;
}

export default function EdgeConfigSection({
  edge,
  nodes,
  panelWidth,
  onClose,
  onDeleteEdge,
}: EdgeConfigSectionProps) {
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  return (
    <Box
      sx={{
        width: panelWidth,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: 11, fontWeight: 600, flex: 1 }}>
          Connection
        </Typography>
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
          onClick={() => {
            onDeleteEdge(edge.id);
            onClose();
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            background: 'none',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '6px',
            px: 1,
            py: 0.75,
            color: '#ef4444',
            fontSize: 11,
            fontWeight: 500,
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
