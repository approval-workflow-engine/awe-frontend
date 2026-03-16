import { useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
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
    init[f.fieldId] = f.type === 'boolean' ? false : '';
  }
  return init;
}

export default function TaskInputForm({ fields, loading, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() => initValues(fields));

  const setValue = (fieldId: string, value: unknown) =>
    setValues((prev) => ({ ...prev, [fieldId]: value }));

  if (fields.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography
        fontSize={11}
        fontWeight={700}
        color="text.secondary"
        mb={2}
        sx={{ textTransform: 'uppercase', letterSpacing: '0.07em' }}
      >
        Your Response
      </Typography>

      <Box display="flex" flexDirection="column" gap={2.5}>
        {fields.map((field) => (
          <Box key={field.fieldId}>
            <Typography fontSize={13} fontWeight={500} mb={0.75}>
              {field.label}
            </Typography>
            <DynamicInput
              field={field}
              value={values[field.fieldId]}
              onChange={(val) => setValue(field.fieldId, val)}
            />
          </Box>
        ))}
      </Box>

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          size="small"
          onClick={() => onSubmit(values)}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={13} /> : undefined}
          sx={{ borderRadius: '8px', fontWeight: 600, height: 32 }}
        >
          Submit Response
        </Button>
      </Box>
    </Paper>
  );
}
