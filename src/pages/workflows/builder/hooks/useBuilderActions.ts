import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { useApiCall } from "../../../../hooks/useApiCall";
import {
  validateVersion,
  createWorkflowVersion,
  updateWorkflowVersion,
  updateVersionStatus,
} from "../../../../api/workflowApi";
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
}

interface UseBuilderActionsReturn {
  saving: boolean;
  committing: boolean;
  activating: boolean;
  deactivating: boolean;
  validationResult: ValidationResult | null;
  setValidationResult: React.Dispatch<React.SetStateAction<ValidationResult | null>>;
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
  handleCommit: () => Promise<void>;
  handleActivate: () => Promise<void>;
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
}: UseBuilderActionsProps): UseBuilderActionsReturn {
  const navigate = useNavigate();
  const { call } = useApiCall();
  const { enqueueSnackbar } = useSnackbar();

  const [saving, setSaving] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [errorsPopoverOpen, setErrorsPopoverOpen] = useState(false);
  const [saveAnchorEl, setSaveAnchorEl] = useState<HTMLButtonElement | null>(null);
  const saveButtonRef = useCallback((el: HTMLButtonElement | null) => setSaveAnchorEl(el), []);
  const [commitConfirmOpen, setCommitConfirmOpen] = useState(false);
  const [activateConfirmOpen, setActivateConfirmOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);

  const saveDraft = async (): Promise<{ versionId: string | null; versionNumber: number | null }> => {
    if (!workflowId) return { versionId: null, versionNumber: null };
    const payload = canvasToVersionPayload(nodes, edges);

    const res = await call(
      () =>
        savedVersionId
          ? updateWorkflowVersion(savedVersionId, payload as Record<string, unknown>)
          : createWorkflowVersion(workflowId, payload as Record<string, unknown>),
      { showError: true },
    );

    if (!res) return { versionId: null, versionNumber: null };

    const body = res as {
      id?: string;
      versionId?: string;
      version?: number;
      versionNumber?: number;
    };

    const versionId = body.id ?? body.versionId ?? null;
    const versionNumber =
      (typeof body.version === "number" ? body.version : undefined) ??
      body.versionNumber ??
      null;

    setSavedVersionId(versionId);
    setSavedVersionNumber(versionNumber);

    if (versionNumber !== null) {
      setLoadedVersionNumber(versionNumber);
      setVersionStatus("draft");
    }

    setIsDirty(false);
    return { versionId, versionNumber };
  };

  const handleSaveDraft = async (): Promise<boolean> => {
    if (!workflowId) return false;

    setSaving(true);
    setValidationResult(null);
    setErrorsPopoverOpen(false);

    const { versionId, versionNumber } = await saveDraft();
    if (!versionId) {
      setSaving(false);
      return false;
    }

    const res = await call(() => validateVersion(versionId), { showError: false });
    const result = res
      ? (res as ValidationResult)
      : { valid: false, errors: [{ code: -1, message: "Validation request failed" }] };

    setValidationResult(result);
    setVersionStatus(result.valid ? "valid" : "draft");
    enqueueSnackbar(
      result.valid ? "Saved - No validation errors" : "Saved - Validation errors present",
      { variant: result.valid ? "success" : "warning" },
    );

    if (!result.valid) setErrorsPopoverOpen(true);

    if (versionNumber !== null && !savedVersionNumber) {
      setSavedVersionNumber(versionNumber);
    }

    setSaving(false);
    return true;
  };

  const handleCommit = async () => {
    if (!savedVersionId) return;

    setCommitting(true);
    const res = await call(
      () => updateVersionStatus(savedVersionId, "published"),
      { successMsg: `v${savedVersionNumber ?? "-"} committed.`, showError: true },
    );
    setCommitting(false);
    setCommitConfirmOpen(false);
    if (res) setVersionStatus("published");
  };

  const handleActivate = async () => {
    if (!savedVersionId || !workflowId) return;

    setActivating(true);
    const res = await call(
      () => updateVersionStatus(savedVersionId, "active"),
      { successMsg: `v${savedVersionNumber ?? "-"} is now active.`, showError: true },
    );
    setActivating(false);
    setActivateConfirmOpen(false);
    if (res) navigate(`/workflows/${workflowId}/versions`);
  };

  const handleDeactivate = async () => {
    if (!savedVersionId) return;

    setDeactivating(true);
    const res = await call(
      () => updateVersionStatus(savedVersionId, "published"),
      { successMsg: `v${savedVersionNumber ?? "-"} deactivated.`, showError: true },
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
        enqueueSnackbar("Workflow JSON copied to clipboard", { variant: "success" });
      })
      .catch(() => {
        enqueueSnackbar("Failed to copy to clipboard", { variant: "error" });
      });
  };

  return {
    saving,
    committing,
    activating,
    deactivating,
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
    handleCommit,
    handleActivate,
    handleDeactivate,
    handleCopyPayload,
  };
}
