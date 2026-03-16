import { TextField, Switch, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import type { UserTaskResponseField } from '../../../types';

interface Props {
  field: UserTaskResponseField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: boolean;
}

function deriveUiType(field: UserTaskResponseField): string {
  if (field.options && field.options.length > 0) return 'dropdown';
  switch (field.type) {
    case 'boolean': return 'checkbox';
    case 'number': return 'number';
    case 'object': return 'textarea';
    default: return 'text';
  }
}

export default function DynamicInput({ field, value, onChange, error }: Props) {
  const { label, options } = field;
  const uiType = deriveUiType(field);

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
        <InputLabel>{label}</InputLabel>
        <Select
          value={typeof value === 'string' ? value : ''}
          label={label}
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

  return (
    <TextField
      fullWidth
      size="small"
      type={uiType === 'number' ? 'number' : 'text'}
      multiline={uiType === 'textarea'}
      minRows={uiType === 'textarea' ? 3 : undefined}
      value={typeof value === 'string' || typeof value === 'number' ? value : ''}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(uiType === 'number' ? (raw === '' ? '' : Number(raw)) : raw);
      }}
      error={error}
    />
  );
}
