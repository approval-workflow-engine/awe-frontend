import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Box,
} from "@mui/material";

import { useApiCall } from "../../../hooks/useApiCall";
import { workflowService } from "../../../api/services/workflow";
import { instanceService } from "../../../api/services/instance";
import type { WorkflowListItem } from "../../../api/schemas/workflow";
import type { InstanceListItem } from "../../../api/schemas/instance";
import { extractApiError } from "../../../utils/apiError";
import WorkflowContextForm, { type StartVariable } from "./WorkflowContextForm";

const formatContextKey = (jsonPath: string) => jsonPath.replace(/^\$\.?/, "");

const buildDefaultContextValues = (
  schema: StartVariable[],
): Record<string, unknown> => {
  return schema.reduce<Record<string, unknown>>((acc, item) => {
    const contextKey = formatContextKey(item.jsonPath);

    acc[contextKey] =
      item.defaultValue ??
      (item.dataType === "boolean"
        ? false
        : item.dataType === "object"
          ? {}
          : item.dataType === "list"
            ? []
            : item.dataType === "null"
              ? null
              : "");

    return acc;
  }, {});
};

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

  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [workflowId, setWorkflowId] = useState("");
  const [workflowVersionId, setWorkflowVersionId] = useState("");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [jsonError, setJsonError] = useState("");
  const [contextJsonError, setContextJsonError] = useState("");
  const [viewMode, setViewMode] = useState<"visual" | "json">("visual");
  const [contextJson, setContextJson] = useState("{}");
  const [submitError, setSubmitError] = useState("");
  const [contextSchema, setContextSchema] = useState<StartVariable[]>([]);
  const [contextValues, setContextValues] = useState<Record<string, unknown>>(
    {},
  );

  const loadWorkflows = useCallback(async () => {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;
    const aggregated: WorkflowListItem[] = [];

    do {
      const res = await call(
        () =>
          workflowService.getWorkflows({
            page,
            limit: pageSize,
          }),
        { showError: false },
      );

      const body = res as {
        workflows?: WorkflowListItem[];
        pagination?: { totalPages?: number };
      } | null;

      aggregated.push(...(body?.workflows ?? []));
      totalPages = Number(body?.pagination?.totalPages ?? 1);
      page += 1;
    } while (page <= totalPages);

    setWorkflows(aggregated);
  }, [call]);

  const syncJsonFromValues = useCallback(
    (nextValues: Record<string, unknown>) => {
      setContextJson(JSON.stringify(nextValues, null, 2));
      setContextJsonError("");
    },
    [],
  );

  const parseContextJson = useCallback(() => {
    try {
      const parsed = JSON.parse(contextJson) as Record<string, unknown>;
      setContextJsonError("");
      return parsed;
    } catch {
      setContextJsonError("Invalid JSON context payload");
      return null;
    }
  }, [contextJson]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      void loadWorkflows();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, loadWorkflows]);

  useEffect(() => {
    const fetchWorkflowInput = async () => {
      if (!open || !workflowVersionId) {
        setContextSchema([]);
        setContextValues({});
        syncJsonFromValues({});
        return;
      }

      const input = await call(
        () => workflowService.getVersion(workflowVersionId),
        {
          showError: false,
          onError: (err) => {
            setSubmitError(extractApiError(err, "Failed to create instance"));
          },
        },
      );

      const nextSchema = input?.startVariables ?? [];
      const nextDefaults = buildDefaultContextValues(nextSchema);

      setContextSchema(nextSchema);
      setContextValues(nextDefaults);
      syncJsonFromValues(nextDefaults);
    };

    const timer = window.setTimeout(() => {
      void fetchWorkflowInput();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, workflowVersionId, call, syncJsonFromValues]);

  const validateForm = () => {
    const valuesToValidate =
      viewMode === "json" ? parseContextJson() : contextValues;

    if (!valuesToValidate) return false;

    for (const item of contextSchema) {
      const contextKey = formatContextKey(item.jsonPath);
      const value = valuesToValidate[contextKey];

      if (
        item.required &&
        (value === undefined || value === null || value === "")
      ) {
        setSubmitError(`${formatContextKey(item.jsonPath)} is required`);
        return false;
      }
    }

    setSubmitError("");
    return true;
  };

  const handleClose = () => {
    setWorkflowId("");
    setWorkflowVersionId("");
    setAutoAdvance(true);
    setJsonError("");
    setContextJsonError("");
    setSubmitError("");
    setViewMode("visual");
    setContextJson("{}");
    setContextSchema([]);
    setContextValues({});
    onClose();
  };

  const handleSubmit = async () => {
    if (!workflowId) return;
    if (!validateForm()) return;

    const submittedContext =
      viewMode === "json" ? (parseContextJson() ?? {}) : contextValues;

    const res = await call(
      () =>
        instanceService.createInstance({
          workflowId,
          context: submittedContext,
          autoAdvance,
        }),
      {
        successMsg: "Instance created successfully",
        showError: false,
        onError: (err) => {
          setSubmitError(extractApiError(err, "Failed to create instance"));
        },
      },
    );

    const instance = res;
    if (!instance) return;

    const selectedWorkflow = workflows.find((w) => w.id === workflowId);

    const enriched: InstanceListItem = {
      id: instance.id,
      status: instance.status,
      controlSignal: instance.controlSignal ?? null,
      autoAdvance: instance.autoAdvance,
      startedAt: instance.startedAt ?? new Date().toISOString(),
      endedAt: instance.endedAt ?? null,
      workflow: {
        id: instance.workflow.id,
        name: selectedWorkflow?.name || instance.workflow.name || "Unknown",
        versionId: instance.workflow.versionId || instance.workflow.id || "",
        version: instance.workflow.version,
      },
      environment: (selectedWorkflow?.environment as never) || "development",
      createdBy: "current_user",
    };

    onCreated(enriched);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Create Instance</DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          pt: 2.5,
        }}
      >
        <FormControl fullWidth size="small">
          <InputLabel>Workflow</InputLabel>

          <Select
            value={workflowId}
            label="Workflow"
            onChange={(e) => {
              const selectedId = e.target.value;
              setWorkflowId(selectedId);
              setWorkflowVersionId(
                workflows.find((w) => w.id === selectedId)?.latestVersion?.id ||
                  "",
              );
            }}
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
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
            mb={1}
          >
            <Typography fontSize={12} color="text.secondary">
              Input Variables
            </Typography>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={viewMode}
              onChange={(_, nextMode: "visual" | "json" | null) => {
                if (!nextMode) return;

                if (nextMode === "json") {
                  setContextJson(JSON.stringify(contextValues, null, 2));
                  setContextJsonError("");
                } else {
                  const parsed = parseContextJson();
                  if (!parsed) return;

                  setContextValues(parsed);
                  setJsonError("");
                }

                setViewMode(nextMode);
              }}
              sx={{
                "& .MuiToggleButton-root": {
                  fontSize: 10,
                  py: 0.25,
                  px: 1.2,
                  textTransform: "none",
                  lineHeight: 1.6,
                },
              }}
            >
              <ToggleButton value="visual">Visual</ToggleButton>
              <ToggleButton value="json">JSON</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {viewMode === "json" ? (
            <TextField
              fullWidth
              multiline
              minRows={10}
              value={contextJson}
              onChange={(e) => {
                const nextValue = e.target.value;
                setContextJson(nextValue);

                try {
                  const parsed = JSON.parse(nextValue) as Record<
                    string,
                    unknown
                  >;
                  setContextValues(parsed);
                  setContextJsonError("");
                } catch {
                  setContextJsonError("Invalid JSON context payload");
                }
              }}
              error={!!contextJsonError}
              placeholder={
                '{\n  "employeeId": "123",\n  "mobile": "9876543210"\n}'
              }
              slotProps={{
                htmlInput: {
                  style: {
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                  },
                },
              }}
            />
          ) : (
            <WorkflowContextForm
              schema={contextSchema}
              values={contextValues}
              onChange={(key, value) => {
                setContextValues((prev) => ({
                  ...prev,
                  [key]: value,
                }));
                setContextJsonError("");
              }}
              setJsonError={setJsonError}
            />
          )}

          {submitError && (
            <Alert severity="error" sx={{ mt: 1, py: 0.25, fontSize: 12 }}>
              {submitError}
            </Alert>
          )}

          {jsonError && (
            <Alert severity="error" sx={{ mt: 1, py: 0.25, fontSize: 12 }}>
              {jsonError}
            </Alert>
          )}

          {contextJsonError && (
            <Alert severity="error" sx={{ mt: 1, py: 0.25, fontSize: 12 }}>
              {contextJsonError}
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
          disabled={!workflowId || !!jsonError || !!contextJsonError || loading}
          startIcon={loading ? <CircularProgress size={13} /> : undefined}
        >
          Create Instance
        </Button>
      </DialogActions>
    </Dialog>
  );
}
