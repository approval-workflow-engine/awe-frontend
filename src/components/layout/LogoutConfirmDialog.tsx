import { Box, Dialog, Typography, Button } from '@mui/material';

interface LogoutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmDialog({ open, onClose, onConfirm }: LogoutConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}
    >
      <Box sx={{ px: 3, pt: 2.5, pb: 2.5 }}>
        <Typography
          sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            mb: 0.75,
          }}
        >
          Sign out?
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: 'text.secondary',
            mb: 2.5,
            lineHeight: 1.6,
          }}
        >
          Are you sure you want to sign out?
        </Typography>
        <Box display="flex" justifyContent="flex-end" gap={1}>
          <Button
            size="small"
            onClick={onClose}
            sx={{ color: 'text.secondary', borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={onConfirm}
            sx={{ borderRadius: '8px', fontWeight: 600 }}
          >
            Sign Out
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
