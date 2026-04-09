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

import {
  cloneWorkflowVersion,
  getWorkflow,
  getWorkflowVersion,
} from "../../api/workflowApi";
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
import {
  VERSION_STATUS_COLOR,
  VERSION_STATUS_BG,
} from "./builder/config/constants";

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

  const [workflowName, setWorkflowName] = useState("");
  const [loadedVersionNumber, setLoadedVersionNumber] = useState<number | null>(
    null,
  );
  const [savedVersionNumber, setSavedVersionNumber] = useState<number | null>(
    null,
  );
  const [savedVersionId, setSavedVersionId] = useState<string | null>(
    versionId ?? null,
  );
  const [versionStatus, setVersionStatus] = useState<string>("draft");
  const [codeEditorOpenState, setCodeEditorOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [cloneConfirmOpen, setCloneConfirmOpen] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [canvasLoading, setCanvasLoading] = useState(() => !!versionId);
  const [configPanelWidth, setConfigPanelWidth] = useState(320);
  const [isResizingConfig, setIsResizingConfig] = useState(false);
  const configResizeOriginRef = useRef({ x: 0, width: 320 });

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
      const wfRes = await call(() => getWorkflow(workflowId), {
        showError: false,
      });
      if (wfRes) {
        const body = wfRes as { name?: string; workflow?: { name?: string } };
        setWorkflowName(body?.workflow?.name ?? body?.name ?? "Workflow");
      }

      if (versionId) {
        const vRes = await call(() => getWorkflowVersion(versionId), {
          showError: false,
        });
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
              (vData.versionNumber as number) ??
              (vData.version as number) ??
              loadedVersionNumber;
            if (typeof vn === "number") {
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

  const handleCloneVersion = useCallback(async () => {
    if (!workflowId || !savedVersionId) return;

    setCloning(true);
    const cloned = await call(() => cloneWorkflowVersion(savedVersionId), {
      successMsg: `v${savedVersionNumber ?? "-"} cloned as a new draft.`,
    });
    setCloning(false);
    setCloneConfirmOpen(false);

    const clonedBody = (cloned ?? {}) as {
      id?: string;
      versionId?: string;
    };
    const clonedVersionId = clonedBody.id ?? clonedBody.versionId ?? null;

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
                ) : validationResult?.valid ? (
                  <CheckCircleIcon sx={{ fontSize: 14, color: "#22c55e" }} />
                ) : validationResult ? (
                  <ErrorIcon sx={{ fontSize: 14, color: "#ef4444" }} />
                ) : (
                  <SaveIcon sx={{ fontSize: 14 }} />
                )
              }
              sx={{
                fontSize: 12,
                height: 30,
                borderRadius: "8px",
                color: validationResult?.valid
                  ? "#22c55e"
                  : validationResult
                    ? "#ef4444"
                    : "text.secondary",
                borderColor: validationResult?.valid
                  ? "#22c55e"
                  : validationResult
                    ? "#ef4444"
                    : "divider",
              }}
            >
              {saving
                ? "Saving…"
                : validationResult?.valid
                  ? "Saved - No errors"
                  : validationResult
                    ? `Saved - ${validationResult.errors.length} error${validationResult.errors.length !== 1 ? "s" : ""}`
                    : "Save"}
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

            <Button
              size="small"
              variant="contained"
              disabled={
                committing ||
                !savedVersionId ||
                versionStatus === "draft" ||
                isDirty
              }
              onClick={() => setCommitConfirmOpen(true)}
              startIcon={
                committing ? (
                  <CircularProgress
                    size={12}
                    sx={{ color: "rgba(245,158,11,0.7)" }}
                  />
                ) : (
                  <LockOutlinedIcon sx={{ fontSize: 14 }} />
                )
              }
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
              Commit
            </Button>
          </>
        )}

        {isReadOnly && versionStatus === "published" && (
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
            <Button
              size="small"
              variant="contained"
              disabled={activating}
              onClick={() => setActivateConfirmOpen(true)}
              startIcon={
                activating ? (
                  <CircularProgress
                    size={12}
                    sx={{ color: "rgba(34,197,94,0.7)" }}
                  />
                ) : (
                  <BoltIcon sx={{ fontSize: 14 }} />
                )
              }
              sx={{
                fontSize: 12,
                height: 30,
                borderRadius: "8px",
                fontWeight: 600,
                backgroundColor: "#22c55e",
                color: "#fff",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#16a34a", boxShadow: "none" },
              }}
            >
              Activate
            </Button>
          </>
        )}

        {isReadOnly && versionStatus === "active" && (
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
            <Button
              size="small"
              variant="outlined"
              disabled={deactivating}
              onClick={() => setDeactivateConfirmOpen(true)}
              startIcon={
                deactivating ? (
                  <CircularProgress size={12} />
                ) : (
                  <PowerSettingsNewIcon sx={{ fontSize: 14 }} />
                )
              }
              sx={{
                fontSize: 12,
                height: 30,
                borderRadius: "8px",
                fontWeight: 600,
                borderColor: "#ef4444",
                color: "#ef4444",
                "&:hover": {
                  backgroundColor: "rgba(239,68,68,0.08)",
                  borderColor: "#ef4444",
                },
              }}
            >
              Deactivate
            </Button>
          </>
        )}

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
            <ContextVarsPanel nodes={nodes} inputs={inputs} />
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
        onConfirmCommit={handleCommit}
        committing={committing}
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
