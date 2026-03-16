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

  if (uiType === 'number') {
    return (
      <TextField
        fullWidth
        size="small"
        type="number"
        value={value === '' || value === null || value === undefined ? '' : String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange('');
          } else {
            const num = Number(raw);
            onChange(isNaN(num) ? '' : num);
          }
        }}
        error={error}
      />
    );
  }

  return (
    <TextField
      fullWidth
      size="small"
      type="text"
      multiline={uiType === 'textarea'}
      minRows={uiType === 'textarea' ? 3 : undefined}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      error={error}
    />
  );
}
