import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { useApiCall } from "../../../../hooks/useApiCall";
import { workflowService } from "../../../../api/services/workflow";
import { canvasToVersionPayload } from "../utils/serialization";
import type { CanvasNode, CanvasEdge } from "../type/types";
import type { ValidationResult } from "../../../../types";

interface UseBuilderActionsProps {
  workflowId: string | undefined;
  savedVersionId: string | null;
  setSavedVersionId: (id: string | null) => void;
  savedVersionNumber: number | null;
  setSavedVersionNumber: (n: number | null) => void;
  setLoadedVersionNumber: (n: number | null) => void;
  setVersionStatus: (s: string) => void;
  setIsDirty: (b: boolean) => void;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  clearHistory: () => void;
}

interface UseBuilderActionsReturn {
  saving: boolean;
  validating: boolean;
  committing: boolean;
  activating: boolean;
  deactivating: boolean;
  releasing: boolean;
  validationResult: ValidationResult | null;
  setValidationResult: React.Dispatch<
    React.SetStateAction<ValidationResult | null>
  >;
  errorsPopoverOpen: boolean;
  setErrorsPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
  saveAnchorEl: HTMLButtonElement | null;
  saveButtonRef: (el: HTMLButtonElement | null) => void;
  commitConfirmOpen: boolean;
  setCommitConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activateConfirmOpen: boolean;
  setActivateConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  deactivateConfirmOpen: boolean;
  setDeactivateConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleSaveDraft: () => Promise<boolean>;
  handleValidateDefinition: () => Promise<void>;
  handleCommit: () => Promise<void>;
  handleActivate: () => Promise<void>;
  handleCommitAndActivate: () => Promise<void>;
  handleDeactivate: () => Promise<void>;
  handleCopyPayload: () => void;
}

export function useBuilderActions({
  workflowId,
  savedVersionId,
  setSavedVersionId,
  savedVersionNumber,
  setSavedVersionNumber,
  setLoadedVersionNumber,
  setVersionStatus,
  setIsDirty,
  nodes,
  edges,
  clearHistory,
}: UseBuilderActionsProps): UseBuilderActionsReturn {
  const navigate = useNavigate();
  const { call } = useApiCall();
  const { enqueueSnackbar } = useSnackbar();

  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [errorsPopoverOpen, setErrorsPopoverOpen] = useState(false);
  const [saveAnchorEl, setSaveAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );
  const saveButtonRef = useCallback(
    (el: HTMLButtonElement | null) => setSaveAnchorEl(el),
    [],
  );
  const [commitConfirmOpen, setCommitConfirmOpen] = useState(false);
  const [activateConfirmOpen, setActivateConfirmOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);

  const handleSaveDraft = async (): Promise<boolean> => {
    if (!workflowId) return false;

    setSaving(true);
    setValidationResult(null);
    setErrorsPopoverOpen(false);

    const payload = canvasToVersionPayload(nodes, edges);
    const saveResponse = await call(
      () =>
        workflowService.saveVersion({
          workflowId,
          versionId: savedVersionId,
          description: payload.description ?? null,
          nodes: payload.nodes,
          edges: payload.edges,
        } as never),
      { showError: true },
    );

    if (!saveResponse) {
      setSaving(false);
      return false;
    }

    const result: ValidationResult = {
      valid: saveResponse.validation.valid,
      errors: saveResponse.validation.errors,
      warnings: saveResponse.validation.warnings,
      versionId: saveResponse.save.versionId,
      version: saveResponse.save.version,
      status: saveResponse.validation.status,
    };

    setSavedVersionId(saveResponse.save.versionId);
    setSavedVersionNumber(saveResponse.save.version);
    setLoadedVersionNumber(saveResponse.save.version);
    setVersionStatus(saveResponse.validation.status);
    setValidationResult(result);
    setErrorsPopoverOpen(!result.valid);
    setIsDirty(false);

    enqueueSnackbar(
      `Draft ${saveResponse.save.operation} (v${saveResponse.save.version})`,
      { variant: "success" },
    );
    enqueueSnackbar(
      result.valid
        ? "Validation passed with no errors"
        : `Validation found ${result.errors.length} error${result.errors.length !== 1 ? "s" : ""}`,
      { variant: result.valid ? "info" : "warning" },
    );

    setSaving(false);
    clearHistory();
    return true;
  };

  const handleValidateDefinition = async () => {
    setValidating(true);

    const payload = canvasToVersionPayload(nodes, edges);
    const response = await call(
      () =>
        workflowService.validateWorkflow({
          nodes: payload.nodes,
          edges: payload.edges,
        }),
      { showError: true },
    );

    const result: ValidationResult = response
      ? {
          ...response,
          warnings: response.warnings ?? [],
        }
      : {
          valid: false,
          errors: [{ code: -1, message: "Validation request failed" }],
          warnings: [],
        };

    setValidationResult(result);
    setErrorsPopoverOpen(!result.valid);

    enqueueSnackbar(
      result.valid
        ? "Validation passed"
        : `Validation found ${result.errors.length} error${result.errors.length !== 1 ? "s" : ""}`,
      { variant: result.valid ? "info" : "warning" },
    );

    setValidating(false);
  };

  const handleCommit = async () => {
    if (!savedVersionId) return;

    setCommitting(true);
    const res = await call(
      () => workflowService.updateVersionStatus(savedVersionId, "published"),
      {
        successMsg: `v${savedVersionNumber ?? "-"} committed.`,
        showError: true,
      },
    );
    setCommitting(false);
    setCommitConfirmOpen(false);
    if (res) setVersionStatus("published");
  };

  const handleActivate = async () => {
    if (!savedVersionId || !workflowId) return;

    setActivating(true);
    const res = await call(
      () => workflowService.updateVersionStatus(savedVersionId, "active"),
      {
        successMsg: `v${savedVersionNumber ?? "-"} is now active.`,
        showError: true,
      },
    );
    setActivating(false);
    setActivateConfirmOpen(false);
    if (res) navigate(`/workflows/${workflowId}/versions`);
  };

  const handleCommitAndActivate = async () => {
    if (!savedVersionId || !workflowId) return;

    setReleasing(true);

    const committed = await call(
      () => workflowService.updateVersionStatus(savedVersionId, "published"),
      {
        showError: true,
      },
    );

    if (!committed) {
      setReleasing(false);
      return;
    }

    setVersionStatus("published");

    const activated = await call(
      () => workflowService.updateVersionStatus(savedVersionId, "active"),
      {
        successMsg: `v${savedVersionNumber ?? "-"} committed and activated.`,
        showError: true,
      },
    );

    setReleasing(false);

    if (activated) {
      navigate(`/workflows/${workflowId}/versions`);
    }
  };

  const handleDeactivate = async () => {
    if (!savedVersionId) return;

    setDeactivating(true);
    const res = await call(
      () => workflowService.updateVersionStatus(savedVersionId, "published"),
      {
        successMsg: `v${savedVersionNumber ?? "-"} deactivated.`,
        showError: true,
      },
    );
    setDeactivating(false);
    setDeactivateConfirmOpen(false);
    if (res) setVersionStatus("published");
  };

  const handleCopyPayload = () => {
    const payload = canvasToVersionPayload(nodes, edges);
    const json = JSON.stringify(payload, null, 2);
    navigator.clipboard
      .writeText(json)
      .then(() => {
        enqueueSnackbar("Workflow JSON copied to clipboard", {
          variant: "success",
        });
      })
      .catch(() => {
        enqueueSnackbar("Failed to copy to clipboard", { variant: "error" });
      });
  };

  return {
    saving,
    validating,
    committing,
    activating,
    deactivating,
    releasing,
    validationResult,
    setValidationResult,
    errorsPopoverOpen,
    setErrorsPopoverOpen,
    saveAnchorEl,
    saveButtonRef,
    commitConfirmOpen,
    setCommitConfirmOpen,
    activateConfirmOpen,
    setActivateConfirmOpen,
    deactivateConfirmOpen,
    setDeactivateConfirmOpen,
    handleSaveDraft,
    handleValidateDefinition,
    handleCommit,
    handleActivate,
    handleCommitAndActivate,
    handleDeactivate,
    handleCopyPayload,
  };
}
