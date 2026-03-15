import { TextField, Switch, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import type { UserTaskResponseField } from '../../../types';

interface Props {
  field: UserTaskResponseField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: boolean;
}

export default function DynamicInput({ field, value, onChange, error }: Props) {
  const { uiType, label, required, options } = field;

  if (uiType === 'checkbox') {
    return (
      <Switch
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        size="small"
      />
    );
  }

  if (uiType === 'dropdown' && options && options.length > 0) {
    return (
      <FormControl fullWidth size="small" error={error}>
        <InputLabel>{label}{required ? ' *' : ''}</InputLabel>
        <Select
          value={typeof value === 'string' ? value : ''}
          label={`${label}${required ? ' *' : ''}`}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt, i) => (
            <MenuItem key={i} value={opt.valueExpression}>
              {opt.label ?? opt.valueExpression}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  const inputTypes: Record<string, string> = {
    number: 'number',
    'date-picker': 'date',
  };

  return (
    <TextField
      fullWidth
      size="small"
      type={inputTypes[uiType ?? 'text'] ?? 'text'}
      multiline={uiType === 'textarea'}
      minRows={uiType === 'textarea' ? 3 : undefined}
      value={typeof value === 'string' || typeof value === 'number' ? value : ''}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(uiType === 'number' ? (raw === '' ? '' : Number(raw)) : raw);
      }}
      error={error}
      slotProps={uiType === 'date-picker' ? { htmlInput: { max: '9999-12-31' } } : undefined}
    />
  );
}
