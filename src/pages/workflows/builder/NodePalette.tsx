import { Box, Typography, Tooltip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import HttpIcon from '@mui/icons-material/Http';
import CodeIcon from '@mui/icons-material/Code';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { PALETTE_NODES, type PaletteNodeType } from './builderTypes';

function getIcon(type: string) {
  const map: Record<string, React.ComponentType<{ sx?: Record<string, unknown> }>> = {
    user_task:         PersonIcon,
    service_task:      HttpIcon,
    script_task:       CodeIcon,
    exclusive_gateway: AltRouteIcon,
    end:               StopCircleIcon,
  };
  const Icon = map[type] || CodeIcon;
  return Icon;
}

interface PaletteCardProps {
  node: PaletteNodeType;
}

function PaletteCard({ node }: PaletteCardProps) {
  const Icon = getIcon(node.type);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('builder/node-type', node.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Tooltip title={`Drag to add ${node.label}`} placement="right">
      <Box
        draggable
        onDragStart={handleDragStart}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          borderRadius: '8px',
          cursor: 'grab',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          userSelect: 'none',
          borderLeft: `3px solid ${node.color}`,
          transition: 'background-color 0.12s',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      >
        <Icon sx={{ fontSize: 16, color: node.color, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.primary', lineHeight: 1 }}>
          {node.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

export default function NodePalette() {
  return (
    <Box sx={{ pb: 1 }}>
      <Box sx={{ px: 1.5, pt: 2, pb: 1 }}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'text.secondary',
          }}
        >
          Nodes
        </Typography>
      </Box>
      <Box sx={{ px: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {PALETTE_NODES.map(node => (
          <PaletteCard key={node.type} node={node} />
        ))}
      </Box>
    </Box>
  );
}
