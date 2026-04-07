import { Box, Typography, TextField } from '@mui/material';
import { EXPR_FONT } from '../constants';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}

export default function JsonPathInput({ value, onChange, placeholder = 'data.field', label }: Props) {
  return (
    <Box>
      {label && (
        <Typography sx={{ fontSize: 10, color: 'text.secondary', mb: 0.25, fontWeight: 500 }}>
          {label}
        </Typography>
      )}
      <TextField
        size="small"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        fullWidth
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '6px', fontSize: 11, fontFamily: EXPR_FONT,
            '& fieldset': { borderColor: 'divider' },
          },
        }}
      />
    </Box>
  );
}
