import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import ControlPointDuplicateIcon from "@mui/icons-material/ControlPointDuplicate";
import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { workflowService } from "../../api/services/workflow";
import { useApiCall } from "../../hooks/useApiCall";
import PageHeader from "../../components/common/PageHeader";
import AppPagination from "../../components/common/AppPagination";
import { useBackNavigation } from "../../hooks/useBackNavigation";
import type { Workflow, WorkflowVersion } from "../../types";
import type { Pagination } from "../../api/schemas/common";
import {
  ENVIRONMENT_OPTIONS,
  getActiveEnvironmentType,
  type EnvironmentType,
} from "../../constants/environment";

type LifecycleAction = "commit" | "activate" | "deactivate" | "clone";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
  valid: { bg: "rgba(6,182,212,0.12)", color: "#06b6d4" },
  published: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  active: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  valid: "Valid",
  published: "Committed",
  active: "Active",
};

const ACTION_CONFIG: Record<
  LifecycleAction,
  {
    title: (vn: number) => string;
    body: string;
    confirmLabel: string;
    confirmColor: string;
  }
> = {
  commit: {
    title: (vn) => `Commit v${vn}?`,
    body: "Locking this version marks it as ready for activation. It can no longer be edited.",
    confirmLabel: "Commit",
    confirmColor: "#f59e0b",
  },
  activate: {
    title: (vn) => `Activate v${vn}?`,
    body: "This will make the selected version the live version for this workflow. The currently active version (if any) will be archived.",
    confirmLabel: "Activate",
    confirmColor: "#22c55e",
  },
  deactivate: {
    title: (vn) => `Deactivate v${vn}?`,
    body: "This will move the version back to Committed status. It will no longer be the live version and no new instances can be started until another version is activated.",
    confirmLabel: "Deactivate",
    confirmColor: "#ef4444",
  },
  clone: {
    title: (vn) => `Clone v${vn}?`,
    body: "This will create a new draft copy of this version so you can edit it safely without changing the original.",
    confirmLabel: "Clone",
    confirmColor: "#3b82f6",
  },
};

const ALLOWED_PROMOTION_TARGETS: Record<EnvironmentType, EnvironmentType[]> = {
  development: ["staging", "production"],
  staging: ["production"],
  production: [],
};

const ENV_DISPLAY: Record<EnvironmentType, string> = {
  development: "Development",
  staging: "Staging",
  production: "Production",
};

export default function WorkflowVersionsPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const { call } = useApiCall();
  const { goBack } = useBackNavigation("/workflows");

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [hasDraftInWorkflow, setHasDraftInWorkflow] = useState(false);

  const [actionTarget, setActionTarget] = useState<{
    version: WorkflowVersion;
    action: LifecycleAction;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [promoteAnchorEl, setPromoteAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [promoteTarget, setPromoteTarget] = useState<WorkflowVersion | null>(
    null,
  );
  const [promoteLoading, setPromoteLoading] = useState(false);

  const activeEnvironmentType = getActiveEnvironmentType();
  const allowedPromotionTargets =
    ALLOWED_PROMOTION_TARGETS[activeEnvironmentType] ?? [];

  const fetchData = useCallback(
    async (pageNum = 1, pageSize = 20) => {
      if (!workflowId) return;

      setLoading(true);

      try {
        const workflowRes = await call(
          () => workflowService.getWorkflow(workflowId),
          {
            showError: false,
          },
        );
        const versionsRes = await call(
          () =>
            workflowService.getWorkflowVersions(workflowId, {
              page: pageNum,
              limit: pageSize,
            }),
          { showError: false },
        );

        if (workflowRes) {
          const wfBody = workflowRes as { workflow?: Workflow } | Workflow;
          const wf =
            (wfBody as { workflow?: Workflow }).workflow ??
            (wfBody as Workflow);
          setWorkflow(wf || null);

          const workflowVersions =
            (
              wf as {
                versions?: Array<{
                  status?: string;
                  version?: number;
                  versionNumber?: number;
                }>;
              }
            )?.versions ?? [];
          setHasDraftInWorkflow(
            workflowVersions.some((v) => {
              const status = v.status?.toLowerCase?.() ?? "";
              return status === "draft" || status === "valid";
            }),
          );
        } else {
          goBack();
          return;
        }

        if (versionsRes) {
          const body = versionsRes as {
            versions?: WorkflowVersion[];
            pagination?: Pagination;
          };
          setVersions(body.versions ?? []);
          setPagination(body.pagination ?? null);
        }
      } finally {
        setLoading(false);
      }
    },
    [workflowId, call, goBack],
  );

  useEffect(() => {
    fetchData(page + 1, limit);
  }, [fetchData, page, limit]);

  const normalizeStatus = (v: WorkflowVersion) =>
    v.status?.toLowerCase?.() || "draft";

  const hasDraft = hasDraftInWorkflow;

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
    setPage(0);
  };

  const openAction = (version: WorkflowVersion, action: LifecycleAction) => {
    setActionTarget({ version, action });
  };

  const openPromoteMenu = (
    event: React.MouseEvent<HTMLElement>,
    version: WorkflowVersion,
  ) => {
    setPromoteAnchorEl(event.currentTarget);
    setPromoteTarget(version);
  };

  const closePromoteMenu = () => {
    if (promoteLoading) return;
    setPromoteAnchorEl(null);
    setPromoteTarget(null);
  };

  const handlePromote = async (targetEnvironmentType: EnvironmentType) => {
    if (!promoteTarget) return;

    setPromoteLoading(true);
    const promoted = await call(
      () => workflowService.promoteWorkflowVersion(promoteTarget.id),
      {
        successMsg: `v${promoteTarget.versionNumber} promoted successfully.`,
      },
    );
    setPromoteLoading(false);

    if (promoted) {
      closePromoteMenu();
      fetchData(page + 1, limit);
    }
  };

  const handleAction = async () => {
    if (!workflowId || !actionTarget) return;

    const { version, action } = actionTarget;

    setActionLoading(true);

    try {
      if (action === "commit") {
        await call(
          () => workflowService.updateVersionStatus(version.id, "published"),
          { successMsg: `v${version.versionNumber} committed.` },
        );
        setActionTarget(null);
        fetchData();
      } else if (action === "activate") {
        await call(
          () => workflowService.updateVersionStatus(version.id, "active"),
          { successMsg: `v${version.versionNumber} is now active.` },
        );
        setActionTarget(null);
        fetchData();
      } else if (action === "deactivate") {
        await call(
          () => workflowService.updateVersionStatus(version.id, "published"),
          {
            successMsg: `v${version.versionNumber} deactivated and moved back to Committed.`,
          },
        );
        setActionTarget(null);
        fetchData();
      } else if (action === "clone") {
        const cloned = await call(
          () => workflowService.cloneWorkflowVersion(version.id),
          { successMsg: `v${version.versionNumber} cloned as a new draft.` },
        );

        const clonedBody = (cloned ?? {}) as {
          id?: string;
          versionId?: string;
        };
        const clonedVersionId = clonedBody.id ?? clonedBody.versionId ?? null;

        setActionTarget(null);

        if (clonedVersionId) {
          navigate(`/workflows/${workflowId}/builder/${clonedVersionId}`);
          return;
        }

        fetchData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredVersions = versions.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const st = normalizeStatus(v);
    return (
      `v${v.versionNumber}`.includes(q) ||
      st.includes(q) ||
      (STATUS_LABELS[st] ?? st).toLowerCase().includes(q) ||
      formatDate(v.createdAt).toLowerCase().includes(q)
    );
  });

  const cfg = actionTarget ? ACTION_CONFIG[actionTarget.action] : null;

  return (
    <Box>
      <PageHeader
        title={workflow?.name || "Version History"}
        subtitle={workflow?.description || undefined}
        onBack={() => navigate("/workflows")}
        chip={
          !loading &&
          versions.length > 0 && (
            <Chip
              label={`${versions.length} version${versions.length !== 1 ? "s" : ""}`}
              size="small"
              sx={{
                fontSize: 10,
                height: 20,
                fontFamily: "'JetBrains Mono', monospace",
                backgroundColor: "action.selected",
                color: "text.secondary",
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          )
        }
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search versions…"
        action={
          <Tooltip
            title={
              hasDraft
                ? "A draft version already exists. Complete it before creating a new one."
                : ""
            }
          >
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={hasDraft}
                onClick={() => navigate(`/workflows/${workflowId}/builder`)}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  height: 36,
                  flexShrink: 0,
                }}
              >
                New Draft
              </Button>
            </span>
          </Tooltip>
        }
      />

      <Paper sx={{ overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right" sx={{ width: 140 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                [0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton height={36} />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredVersions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Box py={6} textAlign="center">
                      {versions.length === 0 ? (
                        <>
                          <Typography
                            sx={{ fontSize: 13, color: "text.secondary" }}
                          >
                            No versions yet.
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              navigate(`/workflows/${workflowId}/builder`)
                            }
                            sx={{
                              mt: 2,
                              borderRadius: "8px",
                              borderColor: "divider",
                              color: "text.secondary",
                            }}
                          >
                            Create First Draft
                          </Button>
                        </>
                      ) : (
                        <>
                          <Typography
                            sx={{ fontSize: 13, color: "text.secondary" }}
                          >
                            No versions match your search.
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => setSearchQuery("")}
                            sx={{
                              mt: 1.5,
                              borderRadius: "8px",
                              color: "text.secondary",
                              fontSize: 12,
                            }}
                          >
                            Clear search
                          </Button>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVersions.map((v) => {
                  const st = normalizeStatus(v);
                  const isDraft = st === "draft";
                  const isValid = st === "valid";
                  const isCommitted = st === "published";
                  const isActive = st === "active";
                  const canClone = isCommitted || isActive;
                  const statusStyle = STATUS_COLORS[st] ?? {
                    bg: "action.selected",
                    color: "text.secondary",
                  };

                  return (
                    <TableRow key={v.id} hover>
                      <TableCell>
                        <Typography
                          sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "text.primary",
                          }}
                        >
                          v{v.versionNumber}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={STATUS_LABELS[st] ?? st}
                          size="small"
                          sx={{
                            fontSize: 11,
                            height: 20,
                            fontWeight: 600,
                            fontFamily: "'JetBrains Mono', monospace",
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                            "& .MuiChip-label": { px: 0.75 },
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            color: "text.disabled",
                          }}
                        >
                          {formatDate(v.createdAt)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="flex-end"
                          gap={0.75}
                        >
                          {(isCommitted || isActive) &&
                            allowedPromotionTargets.length > 0 && (
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={
                                promoteLoading || allowedPromotionTargets.length === 0
                              }
                              endIcon={
                                promoteLoading && promoteTarget?.id === v.id ? (
                                  <CircularProgress size={12} />
                                ) : (
                                  <ArrowDropDownIcon />
                                )
                              }
                              onClick={(event) => openPromoteMenu(event, v)}
                              sx={{
                                minWidth: 92,
                                height: 28,
                                borderRadius: "8px",
                                fontSize: 11,
                                textTransform: "none",
                                borderColor: "divider",
                                color: "text.secondary",
                                "&.Mui-disabled": {
                                  color: "text.disabled",
                                  borderColor: "divider",
                                },
                              }}
                            >
                              Promote
                            </Button>
                          )}

                          <Tooltip
                            title={
                              isDraft || isValid
                                ? "Edit in Builder"
                                : "View in Builder"
                            }
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                navigate(
                                  `/workflows/${workflowId}/builder/${v.id}`,
                                )
                              }
                              sx={{
                                color: "text.disabled",
                                "&:hover": { color: "primary.main" },
                              }}
                            >
                              {isDraft || isValid ? (
                                <EditIcon fontSize="small" />
                              ) : (
                                <VisibilityIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>

                          {isValid && (
                            <Tooltip title="Commit (lock for activation)">
                              <IconButton
                                size="small"
                                onClick={() => openAction(v, "commit")}
                                sx={{
                                  color: "text.disabled",
                                  "&:hover": { color: "#f59e0b" },
                                }}
                              >
                                <LockOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {isCommitted && (
                            <Tooltip title="Activate (make live)">
                              <IconButton
                                size="small"
                                onClick={() => openAction(v, "activate")}
                                sx={{
                                  color: "text.disabled",
                                  "&:hover": { color: "#22c55e" },
                                }}
                              >
                                <BoltIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {isActive && (
                            <Tooltip title="Deactivate (move back to Committed)">
                              <IconButton
                                size="small"
                                onClick={() => openAction(v, "deactivate")}
                                sx={{
                                  color: "text.disabled",
                                  "&:hover": { color: "#ef4444" },
                                }}
                              >
                                <PowerSettingsNewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canClone && (
                            <Tooltip title="Clone as new draft">
                              <IconButton
                                size="small"
                                onClick={() => openAction(v, "clone")}
                                sx={{
                                  color: "text.disabled",
                                  "&:hover": { color: "#3b82f6" },
                                }}
                              >
                                <ControlPointDuplicateIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && versions.length > 0 && (
          <Box
            px={2}
            py={1.25}
            borderTop="1px solid"
            sx={{ borderColor: "divider" }}
          >
            <Typography sx={{ fontSize: 12, color: "text.disabled" }}>
              {filteredVersions.length === versions.length
                ? `${versions.length} version${
                    versions.length !== 1 ? "s" : ""
                  }`
                : `${filteredVersions.length} of ${versions.length} version${
                    versions.length !== 1 ? "s" : ""
                  }`}
            </Typography>
          </Box>
        )}

        <AppPagination
          pagination={pagination}
          page={page}
          rowsPerPage={limit}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[20, 50, 100]}
        />
      </Paper>

      <Dialog
        open={!!actionTarget}
        onClose={() => {
          if (!actionLoading) setActionTarget(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        {actionTarget && cfg && (
          <>
            <DialogTitle
              sx={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {cfg.title(actionTarget.version.versionNumber)}
            </DialogTitle>
            <DialogContent sx={{ pt: "8px !important" }}>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                {cfg.body}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                size="small"
                onClick={() => setActionTarget(null)}
                disabled={actionLoading}
                sx={{ color: "text.secondary" }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handleAction}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  backgroundColor: cfg.confirmColor,
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: cfg.confirmColor,
                    filter: "brightness(0.9)",
                  },
                }}
              >
                {actionLoading ? (
                  <CircularProgress size={14} sx={{ color: "#fff" }} />
                ) : (
                  cfg.confirmLabel
                )}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Menu
        anchorEl={promoteAnchorEl}
        open={!!promoteAnchorEl}
        onClose={closePromoteMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            minWidth: 240,
            borderRadius: "10px",
            border: "1px solid",
            borderColor: "divider",
            mt: 0.5,
          },
        }}
      >
        <MenuItem disabled sx={{ opacity: 1, py: 1.1 }}>
          <Box>
            <Typography sx={{ fontSize: 11, color: "text.disabled" }}>
              Promote from
            </Typography>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
              {ENV_DISPLAY[activeEnvironmentType]}
            </Typography>
          </Box>
        </MenuItem>

        {allowedPromotionTargets.length === 0 && (
          <MenuItem disabled sx={{ opacity: 1 }}>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              No valid promotion targets available.
            </Typography>
          </MenuItem>
        )}

        {ENVIRONMENT_OPTIONS.filter((environmentType) =>
          allowedPromotionTargets.includes(environmentType),
        ).map((environmentType) => (
          <MenuItem
            key={environmentType}
            disabled={promoteLoading}
            onClick={() => handlePromote(environmentType)}
            sx={{
              py: 1,
              textTransform: "capitalize",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                {ENV_DISPLAY[environmentType]}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "text.disabled" }}>
                {ENV_DISPLAY[activeEnvironmentType]} -&gt; {ENV_DISPLAY[environmentType]}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
