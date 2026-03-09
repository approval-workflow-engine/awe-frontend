import { Box, TextField, Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { EXPR_FONT } from '../constants';
import type { ContextVariable } from '../../builderTypes';

interface Props {
  value: ContextVariable;
  onChange: (v: ContextVariable) => void;
  hideNext?: boolean;
}

const VALID_IDENT = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;

export default function ContextVariableSelector({ value, onChange, hideNext = false }: Props) {
  const invalid = value.name.length > 0 && !VALID_IDENT.test(value.name);
  return (
    <Box display="flex" gap={0.5} alignItems="center">
      <TextField
        size="small"
        placeholder="var_name"
        value={value.name}
        onChange={e => onChange({ ...value, name: e.target.value })}
        error={invalid}
        sx={{
          flex: 1,
          '& .MuiOutlinedInput-root': {
            borderRadius: '6px', fontSize: 11, fontFamily: EXPR_FONT,
            '& fieldset': { borderColor: invalid ? 'error.main' : 'divider' },
          },
        }}
        inputProps={{ style: { padding: '4px 8px', fontSize: 11 } }}
      />
      {!hideNext && (
        <ToggleButtonGroup
          value={value.scope}
          exclusive
          onChange={(_, v) => { if (v) onChange({ ...value, scope: v }); }}
          size="small"
          sx={{ height: 28 }}
        >
          <Tooltip title="Available throughout the workflow">
            <ToggleButton value="global" sx={{ fontSize: 9, px: 0.75, py: 0, height: 28, textTransform: 'none', fontWeight: 600, borderColor: 'divider' }}>
              Global
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Only available to the immediately next node">
            <ToggleButton value="next" sx={{ fontSize: 9, px: 0.75, py: 0, height: 28, textTransform: 'none', fontWeight: 600, borderColor: 'divider' }}>
              Next
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
      )}
    </Box>
  );
}
