import React, { useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}

export function CollapsibleSection({ title, children, defaultOpen = false, count }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box>
      <Box
        display="flex" alignItems="center" justifyContent="space-between"
        onClick={() => setOpen(o => !o)}
        sx={{ cursor: 'pointer', py: 0.5, px: 0.5, borderRadius: '4px', '&:hover': { backgroundColor: 'action.hover' } }}
      >
        <Box display="flex" alignItems="center" gap={0.75}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'text.secondary' }}>
            {title}
          </Typography>
          {count !== undefined && count > 0 && (
            <Chip label={count} size="small" sx={{
              height: 15, fontSize: 9,
              '& .MuiChip-label': { px: 0.5 },
              backgroundColor: 'rgba(79,110,247,0.12)', color: 'primary.main',
              border: '1px solid rgba(79,110,247,0.25)',
            }} />
          )}
        </Box>
        <ExpandMoreIcon sx={{
          fontSize: 14, color: 'text.secondary',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
        }} />
      </Box>
      {open && <Box mt={0.75}>{children}</Box>}
    </Box>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'text.secondary', mb: 0.75 }}>
      {children}
    </Typography>
  );
}
