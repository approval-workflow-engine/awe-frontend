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
      const createdDraft = await call(
        () =>
          workflowService.createDraft({
            workflowId,
            description: payload.description || undefined,
            definition: {
              nodes: payload.nodes as any,
              edges: payload.edges as any,
            }
          }),
        { showError: true },
      );

      if (!createdDraft) {
        setSaving(false);
        return false;
      }

      operation = "created";
      targetVersionId = createdDraft.id;
      setSavedVersionId(createdDraft.id);
      
      setVersionStatus(createdDraft.status);

      result = {
        valid: createdDraft.valid ?? false,
        errors: createdDraft.errors ?? [],
        warnings: [],
        versionId: createdDraft.id,
      };
    } else {
      const existingVersionId = targetVersionId;
      const updatedDraft = await call(
        () =>
          workflowService.updateDraft(existingVersionId, {
            description: payload.description ?? null,
            definition: {
              nodes: payload.nodes as any,
              edges: payload.edges as any,
            }
          }),
        { showError: true },
      );

      if (!updatedDraft) {
        setSaving(false);
        return false;
      }

      result = {
        valid: updatedDraft.valid ?? false,
        errors: updatedDraft.errors ?? [],
        warnings: [],
        versionId: existingVersionId,
      };
      setVersionStatus(updatedDraft.status);
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
    let id = savedVersionId;
    if (!id) {
      const saved = await handleSaveDraft();
      if (!saved || !savedVersionId) return;
      // We need the new id (handleSaveDraft updates the ref in react asynchronously, 
      // but it also sets it. To be safe, we might just rely on the side effects,
      // but let's just show saving took place. Actually handleSaveDraft already validates!
      return; 
    }

    setValidating(true);
    
    // Auto-save first
    const saved = await handleSaveDraft();
    if (!saved) {
      setValidating(false);
      return;
    }

    const response = await call<ValidationResult>(
      () => workflowService.validateDraft(id as string),
      { showError: true },
    );

    const result: ValidationResult = {
      ...(response ?? {
        valid: false,
        errors: [{ code: -1, message: "Validation request failed" }],
        warnings: [],
      }),
      warnings: response?.warnings ?? [],
      versionId: id,
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

  const handleCommit = async (incrementType: VersionIncrementType) => {
    if (!savedVersionId) return;

    setCommitting(true);
    const res = await call(
      () =>
        workflowService.publishDraft(
          savedVersionId,
          incrementType,
        ),
      {
        successMsg: `Draft committed (${incrementType} release).`,
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
    
    // We need an environment for activate. For now we use active env, but typically you should know what env.
    const { getActiveEnvironmentType } = await import("../../../../constants/environment");
    const activeEnv = getActiveEnvironmentType();

    setActivating(true);
    const res = await call(
      () => workflowService.activateVersion(savedVersionId, activeEnv),
      {
        successMsg: `v${savedVersionNumber ?? "-"} is now active in ${activeEnv}.`,
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
    
    const { getActiveEnvironmentType } = await import("../../../../constants/environment");
    const activeEnv = getActiveEnvironmentType();

    setReleasing(true);

    const committed = await call(
      () =>
        workflowService.publishDraft(
          savedVersionId,
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
      () => workflowService.activateVersion(committed.id, activeEnv),
      {
        successMsg: `v${committed.version ?? "-"} committed and activated.`,
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
    
    const { getActiveEnvironmentType } = await import("../../../../constants/environment");
    const activeEnv = getActiveEnvironmentType();

    setDeactivating(true);
    const res = await call(
      () => workflowService.deactivateVersion(savedVersionId, activeEnv),
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
