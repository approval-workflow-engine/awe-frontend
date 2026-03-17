import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Box,
} from '@mui/material';
import { useApiCall } from '../../../hooks/useApiCall';
import { getWorkflows } from '../../../api/workflowApi';
import { createInstance } from '../../../api/instanceApi';
import type { Workflow, BackendInstance } from '../../../types';

const DEFAULT_JSON = '{}';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (instance: BackendInstance) => void;
}

export default function CreateInstanceDialog({ open, onClose, onCreated }: Props) {
  const { call, loading } = useApiCall();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowId, setWorkflowId] = useState('');
  const [contextJson, setContextJson] = useState(DEFAULT_JSON);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [jsonError, setJsonError] = useState('');

  const loadWorkflows = useCallback(async () => {
    const res = await call(() => getWorkflows(), { showError: false });
    setWorkflows((res as { workflows: Workflow[] } | null)?.workflows ?? []);
  }, [call]);

  useEffect(() => {
    if (open) loadWorkflows();
  }, [open, loadWorkflows]);

  const handleClose = () => {
    setWorkflowId('');
    setContextJson(DEFAULT_JSON);
    setAutoAdvance(true);
    setJsonError('');
    onClose();
  };

  const validateJson = (val: string) => {
    try {
      JSON.parse(val);
      setJsonError('');
      return true;
    } catch {
      setJsonError('Invalid JSON');
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!workflowId || !validateJson(contextJson)) return;

    const context = JSON.parse(contextJson) as Record<string, unknown>;
    const res = await call(
      () => createInstance({ workflowId, context, autoAdvance }),
      { successMsg: 'Instance created successfully' },
    );

    const instance = (res as { instance: BackendInstance } | null)?.instance;
    if (instance) {
      const selectedWorkflow = workflows.find((w) => w.id === workflowId);
      const enriched: BackendInstance = {
        ...instance,
        workflow_name: selectedWorkflow?.name,
        version_number: selectedWorkflow?.latestVersion ?? null,
      };
      onCreated(enriched);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Create Instance</DialogTitle>
      <Divider />

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Workflow</InputLabel>
          <Select
            value={workflowId}
            label="Workflow"
            onChange={(e) => setWorkflowId(e.target.value)}
          >
            {workflows.length === 0 && (
              <MenuItem disabled value="">
                <Typography fontSize={13} color="text.secondary">
                  No workflows available
                </Typography>
              </MenuItem>
            )}
            {workflows.map((w) => (
              <MenuItem key={w.id} value={w.id}>
                {w.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Typography fontSize={12} color="text.secondary" mb={0.75}>
            Input Variables (JSON)
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={5}
            value={contextJson}
            onChange={(e) => {
              setContextJson(e.target.value);
              if (jsonError) validateJson(e.target.value);
            }}
            onBlur={() => validateJson(contextJson)}
            error={!!jsonError}
            slotProps={{
              htmlInput: { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12 } },
            }}
          />
          {jsonError && (
            <Alert severity="error" sx={{ mt: 0.5, py: 0.25, fontSize: 12 }}>
              {jsonError}
            </Alert>
          )}
        </Box>

        <FormControlLabel
          control={
            <Switch checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} />
          }
          label={
            <Box>
              <Typography fontSize={14}>Auto Advance</Typography>
              <Typography fontSize={12} color="text.secondary">
                Automatically move to the next node after each step
              </Typography>
            </Box>
          }
        />
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button variant="outlined" size="small" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={!workflowId || !!jsonError || loading}
          startIcon={loading ? <CircularProgress size={13} /> : undefined}
        >
          Create Instance
        </Button>
      </DialogActions>
    </Dialog>
  );
}
