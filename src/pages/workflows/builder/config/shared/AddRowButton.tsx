import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface Props {
  label?: string;
  onClick: () => void;
}

export default function AddRowButton({ label = 'Add Row', onClick }: Props) {
  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={<AddIcon sx={{ fontSize: 11 }} />}
      onClick={onClick}
      sx={{
        fontSize: 10, height: 24, borderRadius: '6px',
        color: 'text.secondary', borderColor: 'divider',
        '&:hover': { color: 'text.primary', borderColor: 'text.secondary' },
      }}
    >
      {label}
    </Button>
  );
}
