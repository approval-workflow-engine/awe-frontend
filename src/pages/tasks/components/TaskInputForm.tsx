import { useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DynamicInput from './DynamicInput';
import type { UserTaskResponseField } from '../../../types';

interface Props {
  fields: UserTaskResponseField[];
  loading: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}

function initValues(fields: UserTaskResponseField[]): Record<string, unknown> {
  const init: Record<string, unknown> = {};
  for (const f of fields) {
    init[f.fieldId] = f.default ?? (f.uiType === 'checkbox' ? false : '');
  }
  return init;
}

export default function TaskInputForm({ fields, loading, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() => initValues(fields));
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setValue = (fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setTouched((prev) => ({ ...prev, [fieldId]: true }));
  };

  const isInvalid = (field: UserTaskResponseField) => {
    if (!field.required) return false;
    const v = values[field.fieldId];
    return v === '' || v === null || v === undefined;
  };

  const handleSubmit = () => {
    const allTouched: Record<string, boolean> = {};
    for (const f of fields) allTouched[f.fieldId] = true;
    setTouched(allTouched);

    if (fields.some(isInvalid)) return;

    onSubmit(values);
  };

  if (fields.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2.5}>
        <EditNoteIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography fontWeight={700} fontSize={15}>
          Input Fields
        </Typography>
      </Box>

      <Box display="flex" flexDirection="column" gap={2.5}>
        {fields.map((field) => {
          const invalid = touched[field.fieldId] && isInvalid(field);
          return (
            <Box key={field.fieldId}>
              <Box display="flex" alignItems="center" gap={0.5} mb={0.75}>
                <Typography fontSize={13} fontWeight={500}>
                  {field.label}
                </Typography>
                {field.required && (
                  <Typography fontSize={13} color="error.main" lineHeight={1}>*</Typography>
                )}
              </Box>
              <DynamicInput
                field={field}
                value={values[field.fieldId]}
                onChange={(val) => setValue(field.fieldId, val)}
                error={invalid}
              />
              {invalid && (
                <Typography fontSize={11} color="error.main" mt={0.5}>
                  This field is required
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={13} /> : undefined}
        >
          Submit Response
        </Button>
      </Box>
    </Paper>
  );
}
