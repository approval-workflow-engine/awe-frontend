import { Box, Typography, TextField, InputAdornment } from '@mui/material';
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
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ mr: 0.25, ml: '-2px' }}>
              <Typography sx={{ fontSize: 10, color: 'text.disabled', fontFamily: EXPR_FONT, lineHeight: 1, userSelect: 'none' }}>
                {'{ }'}
              </Typography>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '6px', fontSize: 11, fontFamily: EXPR_FONT,
            '& fieldset': { borderColor: 'divider' },
          },
        }}
        inputProps={{ style: { padding: '5px 6px', fontSize: 11 } }}
      />
    </Box>
  );
}
