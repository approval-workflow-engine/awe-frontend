import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Popover,
  List,
  ListItem,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import SaveIcon from "@mui/icons-material/Save";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import DeleteIcon from "@mui/icons-material/Delete";
import LayersClearIcon from "@mui/icons-material/LayersClear";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import VisibilityIcon from "@mui/icons-material/Visibility";

import {
  getWorkflow,
  getWorkflowVersion,
  validateVersion,
  createWorkflowVersion,
  updateWorkflowVersion,
  updateVersionStatus,
} from "../../api/workflowApi";
import { useApiCall } from "../../hooks/useApiCall";
import { useThemeMode } from "../../context/useThemeMode";
import NodePalette from "./builder/components/NodePalette";
import CanvasPanel from "./builder/components/CanvasPanel";
import ConfigPanel from "./builder/components/ConfigPanel";
import ContextVarsPanel from "./builder/components/ContextVarsPanel";
import ScriptTaskEditorPanel from "./builder/components/ScriptTaskEditorPanel";
import {
  type CanvasNode,
  type CanvasEdge,
  type WorkflowInput,
  type SelectedItem,
} from "./builder/type/types";
import { buildStartNode } from "./builder/utils/nodeHelpers";
import {
  definitionToCanvas,
  canvasToVersionPayload,
} from "./builder/utils/serialization";
import type { ValidationResult } from "../../types";

const VERSION_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  valid: "Valid",
  published: "Committed",
  active: "Active",
};

export default function WorkflowBuilder() {
  const { workflowId, versionNumber } = useParams<{
    workflowId: string;
    versionNumber?: string;
  }>();
  const navigate = useNavigate();
  const { call } = useApiCall();
  const { mode, toggleTheme } = useThemeMode();

  const [workflowName, setWorkflowName] = useState("");
  const [nodes, setNodes] = useState<CanvasNode[]>([buildStartNode()]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [inputs, setInputs] = useState<WorkflowInput[]>([]);
  const [loadedVersionNumber, setLoadedVersionNumber] = useState<number | null>(
    null,
  );
  const [savedVersionNumber, setSavedVersionNumber] = useState<number | null>(
    null,
  );
  const [versionStatus, setVersionStatus] = useState<string>("draft");

  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string;
    portId: string;
  } | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [validateAnchor, setValidateAnchor] =
    useState<HTMLButtonElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [commitConfirmOpen, setCommitConfirmOpen] = useState(false);
  const [activateConfirmOpen, setActivateConfirmOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const [isDirty, setIsDirty] = useState(false);

  const markDirtyEnabled = useRef(false);
  const markDirty = useCallback(() => {
    if (markDirtyEnabled.current) setIsDirty(true);
  }, []);

  const blocker = useBlocker(isDirty);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const isReadOnly =
    !!loadedVersionNumber &&
    (versionStatus === "published" || versionStatus === "active");

  useEffect(() => {
    if (!workflowId) return;
    markDirtyEnabled.current = false;
    (async () => {
      const wfRes = await call(() => getWorkflow(workflowId), {
        showError: false,
      });
      if (wfRes) {
        const body = wfRes as {
          name?: string;
          id?: string;
          workflow?: { name?: string; id?: string };
        };
        setWorkflowName(body?.workflow?.name ?? body?.name ?? "Workflow");
      }

      if (versionNumber) {
        const vRes = await call(
          () => getWorkflowVersion(workflowId, Number(versionNumber)),
          { showError: false },
        );
        if (vRes) {
          const vRaw = vRes as Record<string, unknown>;
          const vData: Record<string, unknown> =
            vRaw.version && typeof vRaw.version === "object"
              ? (vRaw.version as Record<string, unknown>)
              : vRaw;
          if (vData) {
            const { nodes: n, edges: e, inputs: i } = definitionToCanvas(vData);
            setNodes(n.length > 0 ? n : [buildStartNode()]);
            setEdges(e);
            setInputs(i);
            const vn = (vData.versionNumber as number) || Number(versionNumber);
            setLoadedVersionNumber(vn);
            setSavedVersionNumber(vn);
            setVersionStatus(
              (vData.status as string)?.toLowerCase?.() || "draft",
            );
          }
        }
      }

      markDirtyEnabled.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId, versionNumber]);

  const handleUpdateNode = useCallback(
    (id: string, updates: Partial<CanvasNode>) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      );
      markDirty();
    },
    [markDirty],
  );

  const handleAddNode = useCallback(
    (node: CanvasNode) => {
      setNodes((prev) => [...prev, node]);
      markDirty();
    },
    [markDirty],
  );

  const handleAddEdge = useCallback(
    (edge: CanvasEdge) => {
      setEdges((prev) => [...prev, edge]);
      markDirty();
    },
    [markDirty],
  );

  const handleUpdateEdge = useCallback(
    (id: string, updates: Partial<CanvasEdge>) => {
      setEdges((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      );
      markDirty();
    },
    [markDirty],
  );

  const handleDeleteEdge = useCallback(
    (id: string) => {
      setEdges((prev) => prev.filter((e) => e.id !== id));
      markDirty();
    },
    [markDirty],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedItem) return;
    if (selectedItem.type === "node") {
      if (nodes.find((n) => n.id === selectedItem.id)?.type === "start") return;
      setNodes((prev) => prev.filter((n) => n.id !== selectedItem.id));
      setEdges((prev) =>
        prev.filter(
          (e) => e.source !== selectedItem.id && e.target !== selectedItem.id,
        ),
      );
    } else {
      setEdges((prev) => prev.filter((e) => e.id !== selectedItem.id));
    }
    setSelectedItem(null);
    markDirty();
  }, [selectedItem, markDirty, nodes]);

  const handleClearCanvas = useCallback(() => {
    setNodes([buildStartNode()]);
    setEdges([]);
    setInputs([]);
    setSelectedItem(null);
    setCodeEditorOpen(false);
    markDirty();
    setClearConfirmOpen(false);
  }, [markDirty]);

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

  useEffect(() => {
    const node = nodes.find((n) => n.id === selectedItem?.id);
    if (codeEditorOpen && (!node || node.type !== "script_task")) {
      setCodeEditorOpen(false);
    }
  }, [selectedItem, nodes, codeEditorOpen]);

  const saveDraft = async (successMsg?: string): Promise<number | null> => {
    if (!workflowId) return null;
    const payload = canvasToVersionPayload(nodes, edges);
    const res = await call(
      () =>
        savedVersionNumber !== null
          ? updateWorkflowVersion(workflowId, savedVersionNumber, payload as Record<string, unknown>)
          : createWorkflowVersion(workflowId, payload as Record<string, unknown>),
      { successMsg, showError: true },
    );
    if (!res) return null;
    const body = res as { version?: number; versionNumber?: number; id?: string };
    const vn = (typeof body?.version === "number" ? body.version : undefined) ?? body?.versionNumber ?? null;
    setSavedVersionNumber(vn);
    if (vn) {
      setLoadedVersionNumber(vn);
      setVersionStatus("draft");
    }
    setIsDirty(false);
    return vn;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    await saveDraft("Saved.");
    setSaving(false);
  };

  const handleValidate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!workflowId) return;
    setValidating(true);
    setValidationResult(null);
    const vn = await saveDraft();
    if (vn === null) {
      setValidating(false);
      return;
    }
    const res = await call(
      () => validateVersion(workflowId, vn),
      { showError: false },
    );
    setValidationResult(
      res
        ? (res as ValidationResult)
        : { valid: false, errors: [{ code: -1, message: "Validation request failed" }] },
    );
    setValidateAnchor(e.currentTarget);
    setValidating(false);
  };

  const handleCommit = async () => {
    if (!workflowId || !savedVersionNumber) return;
    setCommitting(true);
    const res = await call(
      () => updateVersionStatus(workflowId, savedVersionNumber, "published"),
      { successMsg: `v${savedVersionNumber} committed.`, showError: true },
    );
    setCommitting(false);
    setCommitConfirmOpen(false);
    if (res) {
      setVersionStatus("published");
    }
  };

  const handleActivate = async () => {
    if (!workflowId || !savedVersionNumber) return;
    setActivating(true);
    const res = await call(
      () => updateVersionStatus(workflowId, savedVersionNumber, "active"),
      { successMsg: `v${savedVersionNumber} is now active.`, showError: true },
    );
    setActivating(false);
    setActivateConfirmOpen(false);
    if (res) navigate(`/workflows/${workflowId}/versions`);
  };

  const handleDeactivate = async () => {
    if (!workflowId || !savedVersionNumber) return;
    setDeactivating(true);
    const res = await call(
      () => updateVersionStatus(workflowId, savedVersionNumber, "published"),
      { successMsg: `v${savedVersionNumber} deactivated.`, showError: true },
    );
    setDeactivating(false);
    setDeactivateConfirmOpen(false);
    if (res) {
      setVersionStatus("published");
    }
  };

  const currentVersionNum = savedVersionNumber || loadedVersionNumber;
  const statusLabel = VERSION_STATUS_LABELS[versionStatus] ?? versionStatus;
  const versionLabel = currentVersionNum
    ? `v${currentVersionNum}`
    : "New Draft";

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
      nodes.find((n) => n.id === selectedItem.id)?.type === "start"
    );

  const selectedScriptNode =
    nodes.find((n) => n.id === selectedItem?.id && n.type === "script_task") ??
    null;

  const statusChipSx = {
    draft: { bg: "rgba(168,85,247,0.15)", color: "#a855f7" },
    valid: { bg: "rgba(6,182,212,0.15)", color: "#06b6d4" },
    published: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
    active: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  }[versionStatus] ?? { bg: "rgba(139,145,168,0.15)", color: "#8b91a8" };

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

        <Chip
          label={versionLabel}
          size="small"
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            height: 20,
            backgroundColor: "rgba(79,110,247,0.15)",
            color: "#4f6ef7",
            borderRadius: "99px",
          }}
        />

        {loadedVersionNumber && (
          <Chip
            label={isReadOnly ? `${statusLabel} · Read Only` : statusLabel}
            size="small"
            icon={
              isReadOnly ? (
                <VisibilityIcon
                  sx={{
                    fontSize: "12px !important",
                    color: `${statusChipSx.color} !important`,
                  }}
                />
              ) : undefined
            }
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              height: 20,
              backgroundColor: statusChipSx.bg,
              color: statusChipSx.color,
              borderRadius: "99px",
              "& .MuiChip-icon": { ml: "6px" },
            }}
          />
        )}

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
              size="small"
              onClick={handleValidate}
              disabled={validating || saving}
              startIcon={
                validating ? (
                  <CircularProgress size={12} />
                ) : validationResult?.valid ? (
                  <CheckCircleIcon sx={{ fontSize: 14, color: "#22c55e" }} />
                ) : validationResult ? (
                  <ErrorIcon sx={{ fontSize: 14, color: "#ef4444" }} />
                ) : undefined
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
              variant="outlined"
            >
              {validating
                ? "Validating…"
                : validationResult?.valid
                  ? "Valid"
                  : validationResult
                    ? `${validationResult.errors.length} errors`
                    : "Validate"}
            </Button>

            <Popover
              open={
                !!validateAnchor &&
                !validationResult?.valid &&
                !!validationResult
              }
              anchorEl={validateAnchor}
              onClose={() => setValidateAnchor(null)}
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
                      ? (nodes.find((n) => n.id === err.nodeId)?.label ?? err.nodeId)
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
                            <span style={{ opacity: 0.6 }}> — {nodeLabel}</span>
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
              variant="outlined"
              disabled={saving || validating}
              onClick={handleSaveDraft}
              startIcon={
                saving ? (
                  <CircularProgress size={12} />
                ) : (
                  <SaveIcon sx={{ fontSize: 14 }} />
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
              Save
            </Button>

            <Button
              size="small"
              variant="contained"
              disabled={committing || !savedVersionNumber}
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

          <CanvasPanel
            nodes={nodes}
            edges={edges}
            selectedItem={selectedItem}
            connectingFrom={isReadOnly ? null : connectingFrom}
            errorNodeIds={errorNodeIds}
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
          />

          {selectedItem && (
            <ConfigPanel
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
              onUpdateNode={isReadOnly ? () => undefined : handleUpdateNode}
              onUpdateEdge={isReadOnly ? () => undefined : handleUpdateEdge}
              onDeleteEdge={isReadOnly ? () => undefined : handleDeleteEdge}
              onChangeInputs={(newInputs) => {
                if (isReadOnly) return;
                setInputs(newInputs);
                markDirty();
              }}
              onOpenCodeEditor={() => {
                if (!isReadOnly) setCodeEditorOpen(true);
              }}
            />
          )}
        </Box>

        {codeEditorOpen && selectedScriptNode && !isReadOnly && (
          <ScriptTaskEditorPanel
            node={selectedScriptNode}
            onUpdateConfig={(config) =>
              handleUpdateNode(selectedScriptNode.id, { config })
            }
            onClose={() => setCodeEditorOpen(false)}
          />
        )}
      </Box>

      <Dialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Clear Canvas?
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            This will remove all nodes and edges, leaving only the Start node.
            This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setClearConfirmOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleClearCanvas}
            sx={{
              borderRadius: "8px",
              fontWeight: 600,
              backgroundColor: "#ef4444",
              color: "#fff",
              "&:hover": { backgroundColor: "#dc2626" },
            }}
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={commitConfirmOpen}
        onClose={() => setCommitConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Commit v{savedVersionNumber}?
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Locking <strong>v{savedVersionNumber}</strong> marks it as ready for
            activation. The version can no longer be edited after committing.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setCommitConfirmOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={committing}
            onClick={handleCommit}
            sx={{
              borderRadius: "8px",
              fontWeight: 600,
              backgroundColor: "#f59e0b",
              color: "#fff",
              "&:hover": { backgroundColor: "#d97706" },
            }}
          >
            {committing ? (
              <CircularProgress size={14} sx={{ color: "#fff" }} />
            ) : (
              "Commit"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={activateConfirmOpen}
        onClose={() => setActivateConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Activate v{savedVersionNumber}?
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            This will make <strong>v{savedVersionNumber}</strong> the live
            version for this workflow. The currently active version (if any)
            will be archived.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setActivateConfirmOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={activating}
            onClick={handleActivate}
            sx={{
              borderRadius: "8px",
              fontWeight: 600,
              backgroundColor: "#22c55e",
              color: "#fff",
              "&:hover": { backgroundColor: "#16a34a" },
            }}
          >
            {activating ? (
              <CircularProgress size={14} sx={{ color: "#fff" }} />
            ) : (
              "Activate"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deactivateConfirmOpen}
        onClose={() => setDeactivateConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Deactivate v{savedVersionNumber}?
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            This will move <strong>v{savedVersionNumber}</strong> back to
            Committed status. It will no longer be the live version and no new
            instances can be started until another version is activated.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setDeactivateConfirmOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={deactivating}
            onClick={handleDeactivate}
            sx={{
              borderRadius: "8px",
              fontWeight: 600,
              backgroundColor: "#ef4444",
              color: "#fff",
              "&:hover": { backgroundColor: "#dc2626" },
            }}
          >
            {deactivating ? (
              <CircularProgress size={14} sx={{ color: "#fff" }} />
            ) : (
              "Deactivate"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Unsaved Changes
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            You have unsaved changes. Save your draft before leaving, or your
            work will be lost.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => blocker.reset?.()}
            sx={{ color: "text.secondary" }}
          >
            Stay
          </Button>
          <Button
            size="small"
            onClick={() => blocker.proceed?.()}
            sx={{ color: "#ef4444" }}
          >
            Leave without saving
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={saving}
            onClick={async () => {
              await handleSaveDraft();
              blocker.proceed?.();
            }}
            sx={{ borderRadius: "8px", fontWeight: 600 }}
          >
            {saving ? <CircularProgress size={14} /> : "Save & Leave"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
