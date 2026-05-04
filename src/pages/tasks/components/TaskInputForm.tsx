import { useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, FormHelperText } from '@mui/material';
import DynamicInput from './DynamicInput';
import type { UserTaskResponseField } from '../../../types';

interface Props {
  fields: UserTaskResponseField[];
  loading: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}

function getFieldType(field: UserTaskResponseField): string {
  return String(field.dataType ?? field.type ?? 'string').toLowerCase();
}

function isFieldRequired(field: UserTaskResponseField): boolean {
  if (typeof field.required === 'boolean') {
    return field.required;
  }

  return getFieldType(field) !== 'boolean';
}

function getInitialFieldValue(field: UserTaskResponseField): unknown {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  return getFieldType(field) === 'boolean' ? false : '';
}

function initValues(fields: UserTaskResponseField[]): Record<string, unknown> {
  const init: Record<string, unknown> = {};
  for (const f of fields) {
    init[f.fieldId] = getInitialFieldValue(f);
  }
  return init;
}

function validateValues(
  fields: UserTaskResponseField[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const val = values[f.fieldId];
    const required = isFieldRequired(f);
    const isEmpty =
      val === '' ||
      val === null ||
      val === undefined ||
      (typeof val === 'number' && isNaN(val));
    if (required && isEmpty) {
      errors[f.fieldId] = `${f.label} is required`;
    }
  }
  return errors;
}

function normalizeSubmitValues(
  fields: UserTaskResponseField[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const field of fields) {
    const value = values[field.fieldId];
    const required = isFieldRequired(field);
    const isEmpty =
      value === '' ||
      value === null ||
      value === undefined ||
      (typeof value === 'number' && isNaN(value));

    if (!required && isEmpty) {
      if (field.defaultValue !== undefined) {
        normalized[field.fieldId] = field.defaultValue;
      }
      continue;
    }

    normalized[field.fieldId] = value;
  }

  return normalized;
}

export default function TaskInputForm({ fields, loading, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() => initValues(fields));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setValue = (fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleSubmit = () => {
    const errors = validateValues(fields, values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    onSubmit(normalizeSubmitValues(fields, values));
  };

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
              {isFieldRequired(field) && (
                <Typography component="span" fontSize={13} color="error.main" ml={0.25}>
                  *
                </Typography>
              )}
            </Typography>
            <DynamicInput
              field={field}
              value={values[field.fieldId]}
              onChange={(val) => setValue(field.fieldId, val)}
              error={!!fieldErrors[field.fieldId]}
            />
            {fieldErrors[field.fieldId] && (
              <FormHelperText error sx={{ mt: 0.5, ml: 0 }}>
                {fieldErrors[field.fieldId]}
              </FormHelperText>
            )}
          </Box>
        ))}
      </Box>

      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={13} /> : undefined}
          sx={{ borderRadius: '8px', fontWeight: 600, height: 32 }}
        >
          Submit
        </Button>
      </Box>
    </Paper>
  );
}
