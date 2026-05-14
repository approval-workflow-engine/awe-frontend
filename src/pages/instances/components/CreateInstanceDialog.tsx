import {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";

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

import WorkflowContextForm, {
  type StartVariable,
} from "./WorkflowContextForm";

const formatContextKey = (jsonPath: string) =>
  jsonPath.replace(/^\$\.?/, "");

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (
    instance: InstanceListItem,
  ) => void;
}

export default function CreateInstanceDialog({
  open,
  onClose,
  onCreated,
}: Props) {
  const { call, loading } = useApiCall();

  const [workflows, setWorkflows] = useState<
    WorkflowListItem[]
  >([]);

  const [workflowId, setWorkflowId] =
    useState("");

  const [
    workflowVersionId,
    setWorkflowVersionId,
  ] = useState("");

  const [autoAdvance, setAutoAdvance] =
    useState(true);

  const [jsonError, setJsonError] =
    useState("");

  const [submitError, setSubmitError] =
    useState("");

  const [contextSchema, setContextSchema] =
    useState<StartVariable[]>([]);

  const [contextValues, setContextValues] =
    useState<Record<string, unknown>>(
      {},
    );

  const loadWorkflows = useCallback(async () => {
    const pageSize = 100;

    let page = 1;
    let totalPages = 1;

    const aggregated: WorkflowListItem[] =
      [];

    do {
      const res = await call(
        () =>
          workflowService.getWorkflows({
            page,
            limit: pageSize,
          }),
        {
          showError: false,
        },
      );

      const body = res as {
        workflows?: WorkflowListItem[];
        pagination?: {
          totalPages?: number;
        };
      } | null;

      aggregated.push(
        ...(body?.workflows ?? []),
      );

      totalPages = Number(
        body?.pagination?.totalPages ?? 1,
      );

      page += 1;
    } while (page <= totalPages);

    setWorkflows(aggregated);
  }, [call]);

  useEffect(() => {
    if (open) {
      void loadWorkflows();
    }
  }, [open, loadWorkflows]);

  useEffect(() => {
    const fetchWorkflowInput =
      async () => {
        if (
          !open ||
          !workflowVersionId
        ) {
          setContextSchema([]);
          return;
        }

        const input = await call(
          () =>
            workflowService.getVersion(
              workflowVersionId,
            ),
          {
            showError: false,

            onError: (err) => {
              setSubmitError(
                extractApiError(
                  err,
                  "Failed to create instance",
                ),
              );
            },
          },
        );

        setContextSchema(
          input?.startVariables ?? [],
        );
      };

    void fetchWorkflowInput();
  }, [
    open,
    workflowVersionId,
    call,
  ]);

  const defaultContextValues =
    useMemo(() => {
      return contextSchema.reduce<
        Record<string, unknown>
      >((acc, item) => {
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
    }, [contextSchema]);

  useEffect(() => {
    setContextValues(
      defaultContextValues,
    );
  }, [defaultContextValues]);

  const validateForm = () => {
    for (const item of contextSchema) {
      const contextKey = formatContextKey(item.jsonPath);
      const value = contextValues[contextKey];

      if (
        item.required &&
        (value === undefined ||
          value === null ||
          value === "")
      ) {
        setSubmitError(
          `${formatContextKey(item.jsonPath)} is required`,
        );

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

    setSubmitError("");

    setContextSchema([]);

    setContextValues({});

    onClose();
  };

  const handleSubmit = async () => {
    if (!workflowId) return;

    if (!validateForm()) return;

    const res = await call(
      () =>
        instanceService.createInstance({
          workflowId,
          context: contextValues,
          autoAdvance,
        }),
      {
        successMsg:
          "Instance created successfully",

        showError: false,

        onError: (err) => {
          setSubmitError(
            extractApiError(
              err,
              "Failed to create instance",
            ),
          );
        },
      },
    );

    const instance = res;

    if (!instance) return;

    const selectedWorkflow =
      workflows.find(
        (w) => w.id === workflowId,
      );

    const enriched: InstanceListItem =
      {
        id: instance.id,

        status: instance.status,

        controlSignal:
          instance.controlSignal ??
          null,

        autoAdvance:
          instance.autoAdvance,

        startedAt:
          instance.startedAt ??
          new Date().toISOString(),

        endedAt:
          instance.endedAt ?? null,

        workflow: {
          id: instance.workflow.id,

          name:
            selectedWorkflow?.name ||
            instance.workflow.name ||
            "Unknown",

          versionId:
            instance.workflow
              .versionId ||
            instance.workflow.id ||
            "",

          version:
            instance.workflow.version,
        },

        environment:
          (selectedWorkflow?.environment as never) ||
          "development",

        createdBy: "current_user",
      };

    onCreated(enriched);

    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          pb: 1,
        }}
      >
        Create Instance
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          pt: 2.5,
        }}
      >
        <FormControl
          fullWidth
          size="small"
        >
          <InputLabel>
            Workflow
          </InputLabel>

          <Select
            value={workflowId}
            label="Workflow"
            onChange={(e) => {
              const selectedId =
                e.target.value;

              setWorkflowId(
                selectedId,
              );

              setWorkflowVersionId(
                workflows.find(
                  (w) =>
                    w.id === selectedId,
                )?.latestVersion?.id ||
                  "",
              );
            }}
          >
            {workflows.length === 0 && (
              <MenuItem
                disabled
                value=""
              >
                <Typography
                  fontSize={13}
                  color="text.secondary"
                >
                  No workflows available
                </Typography>
              </MenuItem>
            )}

            {workflows.map((w) => (
              <MenuItem
                key={w.id}
                value={w.id}
              >
                {w.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Typography
            fontSize={12}
            color="text.secondary"
            mb={1}
          >
            Input Variables
          </Typography>

          <WorkflowContextForm
            schema={contextSchema}
            values={contextValues}
            onChange={(
              key,
              value,
            ) => {
              setContextValues(
                (prev) => ({
                  ...prev,
                  [key]: value,
                }),
              );
            }}
            setJsonError={
              setJsonError
            }
          />

          {submitError && (
            <Alert
              severity="error"
              sx={{
                mt: 1,
                py: 0.25,
                fontSize: 12,
              }}
            >
              {submitError}
            </Alert>
          )}

          {jsonError && (
            <Alert
              severity="error"
              sx={{
                mt: 1,
                py: 0.25,
                fontSize: 12,
              }}
            >
              {jsonError}
            </Alert>
          )}
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={
                autoAdvance
              }
              onChange={(e) =>
                setAutoAdvance(
                  e.target.checked,
                )
              }
            />
          }
          label={
            <Box>
              <Typography fontSize={14}>
                Auto Advance
              </Typography>

              <Typography
                fontSize={12}
                color="text.secondary"
              >
                Automatically move
                to the next node
                after each step
              </Typography>
            </Box>
          }
        />
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: 3,
          py: 1.5,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={handleClose}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={
            !workflowId ||
            !!jsonError ||
            loading
          }
          startIcon={
            loading ? (
              <CircularProgress
                size={13}
              />
            ) : undefined
          }
        >
          Create Instance
        </Button>
      </DialogActions>
    </Dialog>
  );
}