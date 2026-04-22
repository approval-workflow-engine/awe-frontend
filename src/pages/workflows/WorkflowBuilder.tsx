import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Popover,
  List,
  ListItem,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import SaveIcon from "@mui/icons-material/Save";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import ControlPointDuplicateIcon from "@mui/icons-material/ControlPointDuplicate";
import DeleteIcon from "@mui/icons-material/Delete";
import LayersClearIcon from "@mui/icons-material/LayersClear";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { secretService } from "../../api/services/secrets";
import type { SecretItem } from "../../api/schemas/secrets";

import { workflowService } from "../../api/services/workflow";
import type { VersionIncrementType } from "../../api/schemas";
import { useApiCall } from "../../hooks/useApiCall";
import { useThemeMode } from "../../context/useThemeMode";
import NodePalette from "./builder/components/NodePalette";
import CanvasPanel from "./builder/components/CanvasPanel";
import ConfigPanel from "./builder/components/ConfigPanel";
import ContextVarsPanel from "./builder/components/ContextVarsPanel";
import ScriptTaskEditorPanel from "./builder/components/ScriptTaskEditorPanel";
import BuilderDialogs from "./builder/components/BuilderDialogs";
import { useBuilderCanvas } from "./builder/hooks/useBuilderCanvas";
import { useBuilderActions } from "./builder/hooks/useBuilderActions";
import { definitionToCanvas } from "./builder/utils/serialization";
import { buildStartNode } from "./builder/utils/nodeHelpers";
import { useBackNavigation } from "../../hooks/useBackNavigation";
import {
  VERSION_STATUS_COLOR,
  VERSION_STATUS_BG,
} from "./builder/config/constants";
import type { AvailableCtxVar } from "./builder/config/context";

type ContextPanelVar = {
  name: string;
  type: string;
  source: string;
};

const VERSION_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  valid: "Valid",
  published: "Committed",
  active: "Active",
};

export default function WorkflowBuilder() {
  const { workflowId, versionId } = useParams<{
    workflowId: string;
    versionId?: string;
  }>();
  const navigate = useNavigate();
  const { call } = useApiCall();
  const { mode, toggleTheme } = useThemeMode();
  const { goBack } = useBackNavigation("/workflows");

  const [workflowName, setWorkflowName] = useState("");
  const [loadedVersionNumber, setLoadedVersionNumber] = useState<
    number | string | null
  >(null);
  const [savedVersionNumber, setSavedVersionNumber] = useState<
    number | string | null
  >(null);
  const [savedVersionId, setSavedVersionId] = useState<string | null>(
    versionId ?? null,
  );
  const [versionStatus, setVersionStatus] = useState<string>("draft");
  const [codeEditorOpenState, setCodeEditorOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [cloneConfirmOpen, setCloneConfirmOpen] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [releaseMenuAnchorEl, setReleaseMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [commitActionMode, setCommitActionMode] = useState<
    "commit" | "commitAndActivate"
  >("commit");
  const [releaseIncrementType, setReleaseIncrementType] =
    useState<VersionIncrementType>("major");
  const [canvasLoading, setCanvasLoading] = useState(() => !!versionId);
  const [configPanelWidth, setConfigPanelWidth] = useState(320);
  const [isResizingConfig, setIsResizingConfig] = useState(false);
  const configResizeOriginRef = useRef({ x: 0, width: 320 });
  const [allAvailableSecrets, setAllAvailableSecrets] = useState<
    AvailableCtxVar[]
  >([]);

  const {
    nodes,
    edges,
    inputs,
    selectedItem,
    setSelectedItem,
    connectingFrom,
    setConnectingFrom,
    isDirty,
    setIsDirty,
    setMarkDirtyEnabled,
    markDirty,
    blocker,
    handleUpdateNode,
    handleAddNode,
    handleAddEdge,
    handleUpdateEdge,
    handleDeleteEdge,
    handleDeleteSelected,
    handleClearCanvas,
    replaceInputs,
    hydrateCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
    beginHistoryBatch,
    endHistoryBatch,
    clearHistory,
  } = useBuilderCanvas();

  const isReadOnly =
    !!loadedVersionNumber &&
    (versionStatus === "published" || versionStatus === "active");

  const {
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
  } = useBuilderActions({
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
  });

  const markDirtyAndClearValidation = useCallback(() => {
    markDirty();
    setValidationResult(null);
  }, [markDirty, setValidationResult]);

  const handleConfigWidthChange = useCallback((width: number) => {
    const clamped = Math.min(Math.max(width, 260), 520);
    setConfigPanelWidth(Math.round(clamped));
  }, []);

  const handleConfigResizeStart = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      configResizeOriginRef.current = {
        x: event.clientX,
        width: configPanelWidth,
      };
      setIsResizingConfig(true);
    },
    [configPanelWidth],
  );

  useEffect(() => {
    if (!isResizingConfig) return;

    const handleMouseMove = (event: MouseEvent) => {
      const delta = configResizeOriginRef.current.x - event.clientX;
      handleConfigWidthChange(configResizeOriginRef.current.width + delta);
    };

    const handleMouseUp = () => {
      setIsResizingConfig(false);
    };

    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
    };
  }, [isResizingConfig, handleConfigWidthChange]);

  useEffect(() => {
    if (!workflowId) return;
    setMarkDirtyEnabled(false);
    (async () => {
      const wfRes = await call(() => workflowService.getWorkflow(workflowId), {
        showError: false,
      });
      if (!wfRes) {
        goBack();
        return;
      }
      if (wfRes) {
        const body = wfRes as { name?: string; workflow?: { name?: string } };
        setWorkflowName(body?.workflow?.name ?? body?.name ?? "Workflow");
      }

      if (versionId) {
        const vRes = await call(() => workflowService.getVersion(versionId), {
          showError: false,
        });
        if (!vRes) {
          goBack();
          return;
        }
        if (vRes) {
          const vRaw = vRes as Record<string, unknown>;
          const vData: Record<string, unknown> =
            vRaw.version && typeof vRaw.version === "object"
              ? (vRaw.version as Record<string, unknown>)
              : vRaw;
          if (vData) {
            const { nodes: n, edges: e, inputs: i } = definitionToCanvas(vData);
            hydrateCanvas(n.length > 0 ? n : [buildStartNode()], e, i);
            const vn =
              (vData.versionNumber as number | string | null | undefined) ??
              (vData.version as number | string | null | undefined) ??
              loadedVersionNumber;
            if (typeof vn === "number" || typeof vn === "string") {
              setLoadedVersionNumber(vn);
              setSavedVersionNumber(vn);
            }
            setSavedVersionId((vData.id as string) ?? versionId);
            setVersionStatus(
              (vData.status as string)?.toLowerCase?.() || "draft",
            );
          }
        }
      }

      setMarkDirtyEnabled(true);
      setCanvasLoading(false);
    })();
  }, [
    workflowId,
    versionId,
    call,
    navigate,
    goBack,
    setMarkDirtyEnabled,
    setWorkflowName,
    hydrateCanvas,
    setLoadedVersionNumber,
    setSavedVersionNumber,
    setSavedVersionId,
    setVersionStatus,
    loadedVersionNumber,
  ]);

  useEffect(() => {
    const fetchSecrets = async () => {
      try {
        const response = await call(() => secretService.list(), { showError: false });
        if (response?.secrets) {
          const transformed = response.secrets
            .filter(
              (secret): secret is SecretItem & { id: string } =>
                typeof secret.id === "string",
            )
            .map((secret) => ({
              id: secret.id,
              name: secret.label,
              type: "string",
              sourceNode: "Secret Management",
            }));
          setAllAvailableSecrets(transformed);
        }
      } catch (err) {
        console.error("Failed to fetch secrets", err);
      }
    };
    fetchSecrets();
  }, [call]);

  const mappedSecrets = useMemo(() => {
    const startNode = nodes.find((n) => n.type === "start");
    if (!startNode?.config?.secretDataMap) return [];

    const secretDataMap = (startNode.config.secretDataMap as Array<{
      secretKey?: string;
      secretId?: string;
    }>) ?? [];

    return secretDataMap.flatMap((row): AvailableCtxVar[] => {
      if (!row.secretKey || !row.secretId) return [];

      const secret = allAvailableSecrets.find((s) => s.id === row.secretId);
      if (!secret) return [];

      return [
        {
          name: row.secretKey,
          type: "string",
          sourceNode: "Start Node (Mapped)",
        },
      ];
    });
  }, [nodes, allAvailableSecrets]);

  const mappedSecretsForContextPanel = useMemo<ContextPanelVar[]>(
    () =>
      mappedSecrets.map((secretVar) => ({
        name: secretVar.name,
        type: secretVar.type,
        source: secretVar.sourceNode,
      })),
    [mappedSecrets],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;
      if (e.key === "Delete" && selectedItem && !isReadOnly)
        handleDeleteSelected();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedItem, handleDeleteSelected, isReadOnly]);

  const currentVersionNum = savedVersionNumber || loadedVersionNumber;
  const statusLabel = VERSION_STATUS_LABELS[versionStatus] ?? versionStatus;
  const versionLabel = currentVersionNum
    ? `v${currentVersionNum}`
    : "New Draft";
  const statusColor = VERSION_STATUS_COLOR[versionStatus] ?? "#8b91a8";
  const statusBg = VERSION_STATUS_BG[versionStatus] ?? "rgba(139,145,168,0.12)";

  const errorNodeIds = useMemo(() => {
    if (!validationResult || validationResult.valid) return new Set<string>();
    return new Set(
      validationResult.errors
        .filter((e) => e.nodeId)
        .map((e) => e.nodeId as string),
    );
  }, [validationResult]);

  const canDelete =
    !isReadOnly &&
    selectedItem &&
    !(
      selectedItem.type === "node" &&
      nodes.find((n: { id: unknown }) => n.id === selectedItem.id)?.type ===
        "start"
    );

  const canCloneVersion =
    !!savedVersionId &&
    (versionStatus === "published" || versionStatus === "active");

  const releaseMenuOpen = Boolean(releaseMenuAnchorEl);
  const canCommit =
    !isReadOnly &&
    !!savedVersionId &&
    versionStatus !== "draft" &&
    !isDirty;
  const canCommitAndActivate = canCommit && !!workflowId;
  const canActivatePublished =
    isReadOnly && versionStatus === "published" && !!savedVersionId;
  const canDeactivateActive =
    isReadOnly && versionStatus === "active" && !!savedVersionId;
  const hasReleaseOptions =
    !isReadOnly || canActivatePublished || canDeactivateActive;

  const handleCloneVersion = useCallback(async () => {
    if (!workflowId || !savedVersionId) return;

    setCloning(true);
    const cloned = await call(
      () => workflowService.cloneWorkflowVersion(savedVersionId),
      {
        successMsg: `v${savedVersionNumber ?? "-"} cloned as a new draft.`,
      },
    );
    setCloning(false);
    setCloneConfirmOpen(false);

    const clonedBody = (cloned ?? {}) as {
      id?: string;
      versionId?: string;
      workflowVersion?: {
        id?: string;
      };
    };
    const clonedVersionId =
      clonedBody.id ??
      clonedBody.versionId ??
      clonedBody.workflowVersion?.id ??
      null;

    if (clonedVersionId) {
      navigate(`/workflows/${workflowId}/builder/${clonedVersionId}`);
    }
  }, [workflowId, savedVersionId, call, savedVersionNumber, navigate]);

  const selectedScriptNode =
    nodes.find(
      (n: { id: unknown; type: string }) =>
        n.id === selectedItem?.id && n.type === "script_task",
    ) ?? null;

  const codeEditorOpen = codeEditorOpenState && !!selectedScriptNode;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "background.default",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          height: 48,
          flexShrink: 0,
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
          display: "flex",
          alignItems: "center",
          px: 1.5,
          gap: 1.5,
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate(`/workflows/${workflowId}/versions`)}
          sx={{ color: "text.secondary" }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: "text.primary",
            whiteSpace: "nowrap",
          }}
        >
          {workflowName || "Builder"}
        </Typography>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ my: "auto", height: 16, borderColor: "divider" }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography
            sx={{
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: "text.secondary",
              fontWeight: 500,
            }}
          >
            {versionLabel}
          </Typography>

          {loadedVersionNumber && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 0.75,
                py: "2px",
                borderRadius: "4px",
                backgroundColor: statusBg,
              }}
            >
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: statusColor,
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  fontSize: 11,
                  color: statusColor,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  userSelect: "none",
                }}
              >
                {statusLabel}
              </Typography>
            </Box>
          )}

          {isReadOnly && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.375,
                px: 0.75,
                py: "2px",
                borderRadius: "4px",
                backgroundColor: "action.hover",
              }}
            >
              <VisibilityIcon sx={{ fontSize: 10, color: "text.disabled" }} />
              <Typography
                sx={{
                  fontSize: 11,
                  color: "text.disabled",
                  fontWeight: 500,
                  lineHeight: 1.2,
                  userSelect: "none",
                }}
              >
                Read Only
              </Typography>
            </Box>
          )}

          {isDirty && !isReadOnly && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 0.75,
                py: "2px",
                borderRadius: "4px",
                backgroundColor: "rgba(245,158,11,0.12)",
              }}
            >
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  fontSize: 11,
                  color: "#f59e0b",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  userSelect: "none",
                }}
              >
                Unsaved
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ flex: 1 }} />

        {canDelete && (
          <Tooltip title={`Delete selected ${selectedItem?.type}`}>
            <IconButton
              size="small"
              onClick={handleDeleteSelected}
              sx={{ color: "#ef4444" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {!isReadOnly && (
          <>
            <Tooltip title="Undo" placement="bottom">
              <span>
                <IconButton
                  size="small"
                  onClick={() => {
                    undo();
                    setValidationResult(null);
                  }}
                  disabled={!canUndo}
                  sx={{ color: canUndo ? "text.secondary" : "text.disabled" }}
                >
                  <UndoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo" placement="bottom">
              <span>
                <IconButton
                  size="small"
                  onClick={() => {
                    redo();
                    setValidationResult(null);
                  }}
                  disabled={!canRedo}
                  sx={{ color: canRedo ? "text.secondary" : "text.disabled" }}
                >
                  <RedoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ my: "auto", height: 24, borderColor: "divider" }}
            />

            <Button
              size="small"
              startIcon={<LayersClearIcon sx={{ fontSize: 14 }} />}
              onClick={() => setClearConfirmOpen(true)}
              sx={{
                fontSize: 12,
                color: "text.secondary",
                borderColor: "divider",
                height: 30,
                borderRadius: "8px",
              }}
              variant="outlined"
            >
              Clear
            </Button>

            <Button
              ref={saveButtonRef}
              size="small"
              variant="outlined"
              disabled={saving}
              onClick={handleSaveDraft}
              startIcon={
                saving ? (
                  <CircularProgress size={12} />
                ) : validationResult?.versionId && validationResult.valid ? (
                  <CheckCircleIcon sx={{ fontSize: 14, color: "#22c55e" }} />
                ) : validationResult?.versionId ? (
                  <ErrorIcon sx={{ fontSize: 14, color: "#ef4444" }} />
                ) : (
                  <SaveIcon sx={{ fontSize: 14 }} />
                )
              }
              sx={{
                fontSize: 12,
                height: 30,
                borderRadius: "8px",
                color: validationResult?.versionId && validationResult.valid
                  ? "#22c55e"
                  : validationResult?.versionId
                    ? "#ef4444"
                    : "text.secondary",
                borderColor: validationResult?.versionId && validationResult.valid
                  ? "#22c55e"
                  : validationResult?.versionId
                    ? "#ef4444"
                    : "divider",
              }}
            >
              {saving
                ? "Saving…"
                : validationResult?.versionId && validationResult.valid
                  ? "Saved - No errors"
                  : validationResult?.versionId
                    ? `Saved - ${validationResult.errors.length} error${validationResult.errors.length !== 1 ? "s" : ""}`
                    : "Save"}
            </Button>

            <Button
              size="small"
              variant="outlined"
              disabled={validating}
              onClick={handleValidateDefinition}
              startIcon={
                validating ? (
                  <CircularProgress size={12} />
                ) : (
                  <CheckCircleIcon sx={{ fontSize: 14 }} />
                )
              }
              sx={{
                fontSize: 12,
                height: 30,
                borderRadius: "8px",
                borderColor: "divider",
                color: "text.secondary",
              }}
            >
              {validating ? "Validating…" : "Validate"}
            </Button>

            <Popover
              open={
                errorsPopoverOpen &&
                !!validationResult &&
                !validationResult.valid
              }
              anchorEl={saveAnchorEl}
              onClose={() => setErrorsPopoverOpen(false)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 0.5,
                    maxWidth: 360,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                  },
                },
              }}
            >
              <Box sx={{ p: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#ef4444",
                    mb: 1,
                  }}
                >
                  Validation Errors
                </Typography>
                <List disablePadding dense>
                  {validationResult?.errors.map((err, i) => {
                    const nodeLabel = err.nodeId
                      ? (nodes.find(
                          (n: { id: string | undefined }) =>
                            n.id === err.nodeId,
                        )?.label ?? err.nodeId)
                      : null;
                    return (
                      <ListItem key={i} sx={{ px: 0, py: 0.25 }}>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: "text.secondary",
                            lineHeight: 1.5,
                          }}
                        >
                          • {err.message}
                          {nodeLabel && (
                            <span style={{ opacity: 0.6 }}> - {nodeLabel}</span>
                          )}
                        </Typography>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            </Popover>

            {hasReleaseOptions && (
              <Button
                size="small"
                variant="contained"
                disabled={
                  committing || activating || deactivating || releasing
                }
                onClick={(event) => setReleaseMenuAnchorEl(event.currentTarget)}
                startIcon={<LockOutlinedIcon sx={{ fontSize: 14 }} />}
                endIcon={<ArrowDropDownIcon sx={{ fontSize: 14 }} />}
                sx={{
                  fontSize: 12,
                  height: 30,
                  borderRadius: "8px",
                  fontWeight: 600,
                  backgroundColor: "rgba(245,158,11,0.9)",
                  color: "#fff",
                  boxShadow: "none",
                  "&:hover": { backgroundColor: "#f59e0b", boxShadow: "none" },
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(245,158,11,0.25)",
                    color: "rgba(245,158,11,0.5)",
                  },
                }}
              >
                Release
              </Button>
            )}
          </>
        )}

        {isReadOnly && (versionStatus === "published" || versionStatus === "active") && (
          <>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ my: "auto", height: 24, borderColor: "divider" }}
            />
            <Button
              size="small"
              variant="outlined"
              disabled={cloning}
              onClick={() => setCloneConfirmOpen(true)}
              startIcon={
                cloning ? (
                  <CircularProgress size={12} />
                ) : (
                  <ControlPointDuplicateIcon sx={{ fontSize: 14 }} />
                )
              }
              sx={{
                fontSize: 12,
                height: 30,
                borderRadius: "8px",
                fontWeight: 600,
                borderColor: "#3b82f6",
                color: "#3b82f6",
                "&:hover": {
                  backgroundColor: "rgba(59,130,246,0.08)",
                  borderColor: "#3b82f6",
                },
              }}
            >
              Clone
            </Button>
            {hasReleaseOptions && (
              <Button
                size="small"
                variant="contained"
                disabled={committing || activating || deactivating || releasing}
                onClick={(event) => setReleaseMenuAnchorEl(event.currentTarget)}
                startIcon={<LockOutlinedIcon sx={{ fontSize: 14 }} />}
                endIcon={<ArrowDropDownIcon sx={{ fontSize: 14 }} />}
                sx={{
                  fontSize: 12,
                  height: 30,
                  borderRadius: "8px",
                  fontWeight: 600,
                  backgroundColor: "rgba(245,158,11,0.9)",
                  color: "#fff",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#f59e0b",
                    boxShadow: "none",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(245,158,11,0.25)",
                    color: "rgba(245,158,11,0.5)",
                  },
                }}
              >
                Release
              </Button>
            )}
          </>
        )}

        <Menu
          anchorEl={releaseMenuAnchorEl}
          open={releaseMenuOpen}
          onClose={() => setReleaseMenuAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {!isReadOnly && (
            <>
              <MenuItem
                disabled={!canCommit || committing}
                onClick={() => {
                  setCommitActionMode("commit");
                  setReleaseMenuAnchorEl(null);
                  setCommitConfirmOpen(true);
                }}
              >
                <ListItemIcon>
                  <LockOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Commit</ListItemText>
              </MenuItem>
              <MenuItem
                disabled={!canCommitAndActivate || releasing}
                onClick={() => {
                  setCommitActionMode("commitAndActivate");
                  setReleaseMenuAnchorEl(null);
                  setCommitConfirmOpen(true);
                }}
              >
                <ListItemIcon>
                  <BoltIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Commit &amp; Activate</ListItemText>
              </MenuItem>
            </>
          )}

          {canActivatePublished && (
            <MenuItem
              disabled={activating}
              onClick={() => {
                setReleaseMenuAnchorEl(null);
                setActivateConfirmOpen(true);
              }}
            >
              <ListItemIcon>
                <BoltIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Activate</ListItemText>
            </MenuItem>
          )}

          {canDeactivateActive && (
            <MenuItem
              disabled={deactivating}
              onClick={() => {
                setReleaseMenuAnchorEl(null);
                setDeactivateConfirmOpen(true);
              }}
            >
              <ListItemIcon>
                <PowerSettingsNewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Deactivate</ListItemText>
            </MenuItem>
          )}
        </Menu>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ my: "auto", height: 24, borderColor: "divider" }}
        />
        <Tooltip title="Copy workflow as JSON">
          <IconButton
            size="small"
            onClick={handleCopyPayload}
            sx={{
              color: "text.disabled",
              "&:hover": { color: "text.primary" },
            }}
          >
            <ContentCopyIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={
            mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          <IconButton
            size="small"
            onClick={toggleTheme}
            sx={{
              color: "text.disabled",
              "&:hover": { color: "text.primary" },
            }}
          >
            {mode === "dark" ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <Box
            sx={{
              width: 200,
              flexShrink: 0,
              borderRight: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.default",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {!isReadOnly && <NodePalette />}
            {isReadOnly && (
              <Box sx={{ p: 1.5, pt: 2 }}>
                <Typography
                  sx={{
                    fontSize: 10,
                    color: "text.disabled",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  View Only
                </Typography>
                <Typography
                  sx={{ fontSize: 11, color: "text.disabled", lineHeight: 1.5 }}
                >
                  This version is <strong>{statusLabel}</strong> and cannot be
                  edited.
                  {versionStatus === "published" &&
                    " Use the Activate button to make it live."}
                  {versionStatus === "active" &&
                    " Use the Deactivate button to move it back to Committed."}
                </Typography>
              </Box>
            )}
            <Divider />
            <ContextVarsPanel
              nodes={nodes}
              inputs={inputs}
              availableSecrets={mappedSecretsForContextPanel}
            />
          </Box>

          {canvasLoading ? (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              <CanvasPanel
                nodes={nodes}
                edges={edges}
                selectedItem={selectedItem}
                connectingFrom={isReadOnly ? null : connectingFrom}
                errorNodeIds={errorNodeIds}
                readOnlyMode={isReadOnly}
                onUpdateNode={isReadOnly ? () => undefined : handleUpdateNode}
                onAddNode={isReadOnly ? () => undefined : handleAddNode}
                onAddEdge={isReadOnly ? () => undefined : handleAddEdge}
                onSelectItem={setSelectedItem}
                onStartConnect={(nodeId, portId) => {
                  if (isReadOnly) return;
                  setSelectedItem(null);
                  setConnectingFrom({ nodeId, portId });
                }}
                onCancelConnect={() => setConnectingFrom(null)}
                onBeginHistoryBatch={beginHistoryBatch}
                onEndHistoryBatch={endHistoryBatch}
              />

              {selectedItem && (
                <Box sx={{ display: "flex", flexShrink: 0 }}>
                  <Box
                    onMouseDown={handleConfigResizeStart}
                    sx={{
                      width: 6,
                      cursor: "col-resize",
                      flexShrink: 0,
                      backgroundColor: isResizingConfig
                        ? "action.hover"
                        : "transparent",
                      transition: "background-color 0.12s",
                      "&:hover": { backgroundColor: "action.hover" },
                    }}
                  />
                  <ConfigPanel
                    width={configPanelWidth}
                    selectedItem={selectedItem}
                    nodes={nodes}
                    edges={edges}
                    inputs={inputs}
                    availableSecrets={mappedSecrets}
                    allAvailableSecrets={allAvailableSecrets}
                    nodeErrors={
                      selectedItem.type === "node"
                        ? (validationResult?.errors.filter(
                            (e) => e.nodeId === selectedItem.id,
                          ) ?? [])
                        : undefined
                    }
                    onClose={() => setSelectedItem(null)}
                    onUpdateNode={
                      isReadOnly ? () => undefined : handleUpdateNode
                    }
                    onUpdateEdge={
                      isReadOnly ? () => undefined : handleUpdateEdge
                    }
                    onDeleteEdge={
                      isReadOnly ? () => undefined : handleDeleteEdge
                    }
                    onChangeInputs={(newInputs) => {
                      if (isReadOnly) return;
                      replaceInputs(newInputs);
                      markDirtyAndClearValidation();
                    }}
                    onOpenCodeEditor={() => {
                      setCodeEditorOpen(true);
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>

        {codeEditorOpen && selectedScriptNode && (
          <ScriptTaskEditorPanel
            node={selectedScriptNode}
            onUpdateConfig={(config) =>
              handleUpdateNode(selectedScriptNode.id, { config })
            }
            onClose={() => setCodeEditorOpen(false)}
            isReadOnly={isReadOnly}
          />
        )}
      </Box>

      <BuilderDialogs
        clearConfirmOpen={clearConfirmOpen}
        onCloseClearConfirm={() => setClearConfirmOpen(false)}
        onConfirmClear={() =>
          handleClearCanvas(() => setClearConfirmOpen(false))
        }
        commitConfirmOpen={commitConfirmOpen}
        onCloseCommitConfirm={() => setCommitConfirmOpen(false)}
        onConfirmCommit={() => {
          if (commitActionMode === "commitAndActivate") {
            void handleCommitAndActivate(releaseIncrementType);
            return;
          }

          void handleCommit(releaseIncrementType);
        }}
        committing={commitActionMode === "commitAndActivate" ? releasing : committing}
        commitActionMode={commitActionMode}
        releaseIncrementType={releaseIncrementType}
        onReleaseIncrementTypeChange={setReleaseIncrementType}
        activateConfirmOpen={activateConfirmOpen}
        onCloseActivateConfirm={() => setActivateConfirmOpen(false)}
        onConfirmActivate={handleActivate}
        activating={activating}
        deactivateConfirmOpen={deactivateConfirmOpen}
        onCloseDeactivateConfirm={() => setDeactivateConfirmOpen(false)}
        onConfirmDeactivate={handleDeactivate}
        deactivating={deactivating}
        cloneConfirmOpen={cloneConfirmOpen}
        onCloseCloneConfirm={() => setCloneConfirmOpen(false)}
        onConfirmClone={handleCloneVersion}
        cloning={cloning}
        canCloneVersion={canCloneVersion}
        blocker={blocker}
        onSaveAndLeave={handleSaveDraft}
        saving={saving}
        savedVersionNumber={savedVersionNumber}
      />
    </Box>
  );
}
