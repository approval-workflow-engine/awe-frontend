import { useEffect, useState } from "react";
import {
  Alert,
  Dialog,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { useApiCall } from "../../../hooks/useApiCall";
import { instanceService } from "../../../api/services/instance";
import type { Instance } from "../../../api/schemas/instance";
import { extractApiError } from "../../../utils/apiError";

const DEFAULT_JSON = "{}";

interface Props {
  open: boolean;
  instance: Instance | null;
  onClose: () => void;
  onRetried: () => Promise<void> | void;
}

export default function RetryInstanceDialog({
  open,
  instance,
  onClose,
  onRetried,
}: Props) {
  const { call, loading } = useApiCall();
  const [constantsJson, setConstantsJson] = useState(DEFAULT_JSON);
  const [jsonError, setJsonError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open || !instance) {
      return;
    }

    const constants = instance.currentVariables?.constants ?? {};
    setConstantsJson(JSON.stringify(constants, null, 2));
    setSubmitError("");
    setJsonError("");
  }, [open, instance]);

  const handleClose = () => {
    setConstantsJson(DEFAULT_JSON);
    setJsonError("");
    setSubmitError("");
    onClose();
  };

  const validateJson = (value: string) => {
    try {
      JSON.parse(value);
      setJsonError("");
      return true;
    } catch {
      setJsonError("Invalid JSON");
      return false;
    }
  };

  const handleRetry = async () => {
    if (!instance?.currentTask?.id) {
      setSubmitError("No task found to retry");
      return;
    }

    if (!validateJson(constantsJson)) {
      return;
    }

    setSubmitError("");

    const parsed = JSON.parse(constantsJson) as Record<string, unknown>;
    const res = await call(
      () =>
        instanceService.retryTask(instance.currentTask!.id!, {
          context: parsed,
        }),
      {
        successMsg: "Task retried successfully",
        showError: false,
        onError: (err) => {
          setSubmitError(extractApiError(err, "Failed to retry task"));
        },
      },
    );

    if (res) {
      await onRetried();
      handleClose();
    }
  };


  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Retry Task</DialogTitle>
      <Divider />

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2.5 }}>
        <Typography fontSize={13} color="text.secondary">
          Update constant values before retrying this task sequence.
        </Typography>

        <TextField
          fullWidth
          multiline
          minRows={10}
          value={constantsJson}
          onChange={(e) => {
            setConstantsJson(e.target.value);
            if (jsonError) {
              validateJson(e.target.value);
            }
          }}
          onBlur={() => validateJson(constantsJson)}
          error={!!jsonError}
          placeholder="{}"
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
          <Alert severity="error" sx={{ py: 0.25, fontSize: 12 }}>
            {submitError}
          </Alert>
        )}

        {jsonError && (
          <Alert severity="error" sx={{ py: 0.25, fontSize: 12 }}>
            {jsonError}
          </Alert>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button variant="outlined" size="small" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleRetry}
          disabled={loading || !!jsonError}
          startIcon={loading ? <CircularProgress size={13} /> : undefined}
        >
          Retry
        </Button>

      </DialogActions>
    </Dialog>
  );
}
