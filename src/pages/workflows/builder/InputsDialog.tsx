import {
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, Switch, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { type WorkflowInput } from './types';

interface InputsDialogProps {
  open: boolean;
  onClose: () => void;
  inputs: WorkflowInput[];
  onChange: (inputs: WorkflowInput[]) => void;
}

export default function InputsDialog({ open, onClose, inputs, onChange }: InputsDialogProps) {
  const addInput = () =>
    onChange([...inputs, { name: '', type: 'string', required: false }]);

  const updateInput = (i: number, updates: Partial<WorkflowInput>) =>
    onChange(inputs.map((v, idx) => idx === i ? { ...v, ...updates } : v));

  const removeInput = (i: number) =>
    onChange(inputs.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
        Workflow Inputs
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2 }}>
          Define the input variables that every new instance of this workflow must provide.
        </Typography>

        {inputs.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>No inputs defined</Typography>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={1}>
            {inputs.map((input, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  backgroundColor: 'action.hover',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <TextField
                  size="small"
                  placeholder="Variable name"
                  value={input.name}
                  onChange={e => updateInput(i, { name: e.target.value })}
                  sx={{
                    flex: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '6px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                    },
                  }}
                />
                <Select
                  size="small"
                  value={input.type}
                  onChange={e => updateInput(i, { type: e.target.value as WorkflowInput['type'] })}
                  sx={{ flex: 1, borderRadius: '6px', fontSize: 12 }}
                >
                  {(['string', 'number', 'boolean', 'object'] as const).map(t => (
                    <MenuItem key={t} value={t} sx={{ fontSize: 12 }}>{t}</MenuItem>
                  ))}
                </Select>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Required</Typography>
                  <Switch
                    size="small"
                    checked={input.required}
                    onChange={e => updateInput(i, { required: e.target.checked })}
                  />
                </Box>
                <IconButton size="small" onClick={() => removeInput(i)} sx={{ color: '#ef4444', p: 0.25, flexShrink: 0 }}>
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        <Button
          startIcon={<AddIcon />}
          size="small"
          onClick={addInput}
          sx={{
            mt: 1.5,
            borderRadius: '8px',
            color: 'text.secondary',
            borderColor: 'divider',
            fontSize: 12,
          }}
          variant="outlined"
        >
          Add Input
        </Button>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          size="small"
          onClick={onClose}
          sx={{ borderRadius: '8px', fontWeight: 600 }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog >
  );
}
