import { useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import { useApiCall } from "../../../hooks/useApiCall";
import { workflowService } from "../../../api/services/workflow";
import { instanceService } from "../../../api/services/instance";
import type { Workflow } from "../../../types";
import type { InstanceListItem } from "../../../api/schemas/instance";
import { extractApiError } from "../../../utils/apiError";

const DEFAULT_JSON = "{}";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (instance: InstanceListItem) => void;
}

export default function CreateInstanceDialog({
  open,
  onClose,
  onCreated,
}: Props) {
  const { call, loading } = useApiCall();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowId, setWorkflowId] = useState("");
  const [contextJson, setContextJson] = useState(DEFAULT_JSON);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [jsonError, setJsonError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const loadWorkflows = useCallback(async () => {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;
    const aggregated: Workflow[] = [];

    do {
      const res = await call(
        () => workflowService.getWorkflows({ page, limit: pageSize }),
        { showError: false },
      );
      const body = res as {
        workflows?: Workflow[];
        pagination?: { totalPages?: number };
      } | null;

      aggregated.push(...(body?.workflows ?? []));
      totalPages = Number(body?.pagination?.totalPages ?? 1);
      page += 1;
    } while (page <= totalPages);

    setWorkflows(aggregated);
  }, [call]);

  useEffect(() => {
    if (open) {
      (async () => {
        await loadWorkflows();
      })();
    }
  }, [open, loadWorkflows]);

  const handleClose = () => {
    setWorkflowId("");
    setContextJson(DEFAULT_JSON);
    setAutoAdvance(true);
    setJsonError("");
    setSubmitError("");
    onClose();
  };

  const validateJson = (val: string) => {
    try {
      JSON.parse(val);
      setJsonError("");
      return true;
    } catch {
      setJsonError("Invalid JSON");
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!workflowId || !validateJson(contextJson)) return;

    setSubmitError("");

    const context = JSON.parse(contextJson) as Record<string, unknown>;
    const res = await call(
      () =>
        instanceService.createInstance({ workflowId, context, autoAdvance }),
      {
        successMsg: "Instance created successfully",
        showError: false,
        onError: (err) => {
          setSubmitError(extractApiError(err, "Failed to create instance"));
        },
      },
    );

    const instance = res;
    if (instance) {
      const selectedWorkflow = workflows.find((w) => w.id === workflowId);
      const timestamp = instance.startedAt ?? new Date().toISOString();
      const enriched: InstanceListItem = {
        id: instance.id,
        status: instance.status,
        controlSignal: instance.controlSignal ?? null,
        autoAdvance: instance.autoAdvance,
        startedAt: timestamp,
        endedAt: instance.endedAt ?? null,
        workflow: {
          id: instance.workflow.id,
          name: selectedWorkflow?.name || instance.workflow.name || "Unknown",
          versionId: instance.workflow.versionId || instance.workflow.id || "",
          version: instance.workflow.version,
        },
        environment: (selectedWorkflow?.environment as any) || "development",
        createdBy: "current_user",
      };
      onCreated(enriched);

      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Create Instance</DialogTitle>
      <Divider />

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2.5 }}
      >
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
              htmlInput: {
                style: {
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                },
              },
            }}
          />
          {submitError && (
            <Alert severity="error" sx={{ mt: 0.5, py: 0.25, fontSize: 12 }}>
              {submitError}
            </Alert>
          )}
          {jsonError && (
            <Alert severity="error" sx={{ mt: 0.5, py: 0.25, fontSize: 12 }}>
              {jsonError}
            </Alert>
          )}
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
            />
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
