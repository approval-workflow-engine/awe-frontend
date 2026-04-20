import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { useApiCall } from "../../../../hooks/useApiCall";
import { workflowService } from "../../../../api/services/workflow";
import type { VersionIncrementType } from "../../../../api/schemas";
import { canvasToVersionPayload } from "../utils/serialization";
import type { CanvasNode, CanvasEdge } from "../type/types";
import type { ValidationResult } from "../../../../types";

interface UseBuilderActionsProps {
  workflowId: string | undefined;
  savedVersionId: string | null;
  setSavedVersionId: (id: string | null) => void;
  savedVersionNumber: number | string | null;
  setSavedVersionNumber: (n: number | string | null) => void;
  setLoadedVersionNumber: (n: number | string | null) => void;
  setVersionStatus: (s: string) => void;
  isDirty: boolean;
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
  handleCommit: (incrementType: VersionIncrementType) => Promise<void>;
  handleActivate: () => Promise<void>;
  handleCommitAndActivate: (
    incrementType: VersionIncrementType,
  ) => Promise<void>;
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
  isDirty,
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

  const applyStatusResponse = useCallback(
    (response?: { status?: string; version?: number | string | null }) => {
      if (!response) return;

      if (response.status) {
        setVersionStatus(response.status);
      }

      if (response.version !== undefined && response.version !== null) {
        setSavedVersionNumber(response.version);
        setLoadedVersionNumber(response.version);
      }
    },
    [setLoadedVersionNumber, setSavedVersionNumber, setVersionStatus],
  );

  const handleSaveDraft = async (): Promise<boolean> => {
    if (!workflowId) return false;

    setSaving(true);
    setValidationResult(null);
    setErrorsPopoverOpen(false);

    const payload = canvasToVersionPayload(nodes, edges);

    let targetVersionId = savedVersionId;
    let operation: "created" | "updated" = "updated";
    let result: ValidationResult | null = null;

    if (!targetVersionId) {
      const createdVersion = await call(
        () =>
          workflowService.createVersion(workflowId, {
            description: payload.description || undefined,
            nodes: payload.nodes,
            edges: payload.edges,
          } as never),
        { showError: true },
      );

      if (!createdVersion) {
        setSaving(false);
        return false;
      }

      operation = "created";
      targetVersionId = createdVersion.id;
      setSavedVersionId(createdVersion.id);

      if (createdVersion.version !== undefined && createdVersion.version !== null) {
        setSavedVersionNumber(createdVersion.version);
        setLoadedVersionNumber(createdVersion.version);
      }

      setVersionStatus(createdVersion.status);

      result = {
        valid: createdVersion.valid,
        errors: createdVersion.errors,
        warnings: createdVersion.warnings ?? [],
        versionId: createdVersion.id,
        version:
          createdVersion.version ??
          (savedVersionNumber === null ? undefined : savedVersionNumber),
        status: createdVersion.status,
      };
    } else {
      const existingVersionId = targetVersionId;
      const updatedVersion = await call(
        () =>
          workflowService.updateVersion(existingVersionId, {
            description: payload.description ?? null,
            nodes: payload.nodes,
            edges: payload.edges,
          } as never),
        { showError: true },
      );

      if (!updatedVersion) {
        setSaving(false);
        return false;
      }

      result = {
        valid: updatedVersion.valid,
        errors: updatedVersion.errors,
        warnings: updatedVersion.warnings ?? [],
        versionId: existingVersionId,
        version:
          savedVersionNumber === null ? undefined : savedVersionNumber,
        status: updatedVersion.status,
      };
      setVersionStatus(updatedVersion.status);
    }

    if (!result || !targetVersionId) {
      setSaving(false);
      return false;
    }

    setSavedVersionId(targetVersionId);
    setValidationResult(result);
    setErrorsPopoverOpen(!result.valid);
    setIsDirty(false);

    const versionSuffix = result.version ? ` (v${result.version})` : "";
    enqueueSnackbar(`Draft ${operation}${versionSuffix}.`, {
      variant: "success",
    });
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
      () => {
        // For clean persisted drafts, fetch validation from /validate on the version.
        if (savedVersionId && !isDirty) {
          return workflowService.validateVersion(savedVersionId);
        }

        return workflowService.validateWorkflow({
          description: payload.description ?? null,
          nodes: payload.nodes,
          edges: payload.edges,
        });
      },
      { showError: true },
    );

    const result: ValidationResult = {
      ...(response ?? {
        valid: false,
        errors: [{ code: -1, message: "Validation request failed" }],
        warnings: [],
      }),
      warnings: response?.warnings ?? [],
      versionId: savedVersionId ?? undefined,
      version: savedVersionNumber ?? undefined,
    };

    if (response?.status) {
      setVersionStatus(response.status);
    }

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

  const handleCommit = async (incrementType: VersionIncrementType) => {
    if (!savedVersionId) return;

    setCommitting(true);
    const res = await call(
      () =>
        workflowService.updateVersionStatus(
          savedVersionId,
          "published",
          incrementType,
        ),
      {
        successMsg: `v${savedVersionNumber ?? "-"} committed (${incrementType} release).`,
        showError: true,
      },
    );
    setCommitting(false);
    setCommitConfirmOpen(false);
    if (res) {
      applyStatusResponse(res);
    }
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
    if (res) {
      applyStatusResponse(res);
      navigate(`/workflows/${workflowId}/versions`);
    }
  };

  const handleCommitAndActivate = async (
    incrementType: VersionIncrementType,
  ) => {
    if (!savedVersionId || !workflowId) return;

    setReleasing(true);

    const committed = await call(
      () =>
        workflowService.updateVersionStatus(
          savedVersionId,
          "published",
          incrementType,
        ),
      {
        showError: true,
      },
    );

    if (!committed) {
      setReleasing(false);
      return;
    }

    applyStatusResponse(committed);

    const activated = await call(
      () => workflowService.updateVersionStatus(savedVersionId, "active"),
      {
        successMsg: `v${savedVersionNumber ?? "-"} committed and activated.`,
        showError: true,
      },
    );

    setReleasing(false);

    if (activated) {
      applyStatusResponse(activated);
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
    if (res) {
      applyStatusResponse(res);
    }
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
