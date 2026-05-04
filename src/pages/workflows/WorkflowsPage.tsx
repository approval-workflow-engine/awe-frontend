import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { workflowService } from "../../api/services/workflow";
import { useApiCall } from "../../hooks/useApiCall";
import { extractApiError } from "../../utils/apiError";
import DialogErrorAlert from "../../components/common/DialogErrorAlert";
import PageHeader from "../../components/common/PageHeader";
import AppPagination from "../../components/common/AppPagination";
import type { WorkflowListItem as Workflow } from "../../api/schemas/workflow";
import type { Pagination } from "../../api/schemas/common";
import { getActiveEnvironmentType } from "../../constants/environment";

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { call } = useApiCall();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modifiedSort, setModifiedSort] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", description: "" });
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Workflow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const filteredWorkflows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return workflows;
    }

    return workflows.filter((workflow) =>
      workflow.name.toLowerCase().includes(query),
    );
  }, [workflows, searchQuery]);

  const fetchWorkflows = useCallback(
    async (
      pageNum = 1,
      pageSize = 20,
      search = "",
      sort: "asc" | "desc" = "desc",
    ) => {
      setListLoading(true);
      try {
        const res = await call(() =>
          workflowService.getWorkflows({
            page: pageNum,
            limit: pageSize,
            modifiedSort: sort,
            ...(search.trim() ? { search: search.trim() } : {}),
          }),
        );
        if (res) {
          const body = res as {
            workflows?: Workflow[];
            pagination?: Pagination;
          };
          const list =
            body?.workflows ??
            (Array.isArray(body) ? (body as unknown as Workflow[]) : []);
          setWorkflows(list);
          if (body?.pagination) {
            setPagination(body.pagination);
          }
        }
      } finally {
        setListLoading(false);
      }
    },
    [call],
  );

  useEffect(() => {
    fetchWorkflows(page + 1, limit, searchQuery, modifiedSort);
  }, [fetchWorkflows, page, limit, searchQuery, modifiedSort]);

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

  const handleNewSubmit = async () => {
    if (!newForm.name.trim()) return;
    setNewLoading(true);
    setNewError("");
    const res = await call(
      () =>
        workflowService.createWorkflow({
          name: newForm.name.trim(),
          description: newForm.description.trim() || undefined,
          environment: getActiveEnvironmentType(),
        }),
      {
        showError: false,
        onError: (err) => {
          setNewError(extractApiError(err, "Failed to create workflow"));
        },
      },
    );
    setNewLoading(false);
    if (res) {
      setNewOpen(false);
      setNewForm({ name: "", description: "" });
      fetchWorkflows(page + 1, limit, searchQuery, modifiedSort);
    }
  };

  const openEdit = (wf: Workflow) => {
    setEditTarget(wf);
    setEditForm({ name: wf.name, description: wf.description || "" });
    setEditError("");
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editTarget || !editForm.name.trim()) return;
    setEditLoading(true);
    setEditError("");
    const res = await call(
      () =>
        workflowService.updateWorkflow(editTarget.id, {
          name: editForm.name.trim(),
          description: editForm.description.trim() || undefined,
        }),
      {
        showError: false,
        onError: (err) => {
          setEditError(extractApiError(err, "Failed to update workflow"));
        },
      },
    );
    setEditLoading(false);
    if (res) {
      setEditOpen(false);
      fetchWorkflows(page + 1, limit, searchQuery, modifiedSort);
    }
  };

  const openDelete = (wf: Workflow) => {
    setDeleteTarget(wf);
    setDeleteError("");
    setDeleteConfirmText("");
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");
    let succeeded = false;
    let errMsg = "";
    await call(() => workflowService.deleteWorkflow(deleteTarget.id), {
      showError: false,
      onSuccess: () => {
        succeeded = true;
      },
      onError: (err) => {
        errMsg = extractApiError(err, "Failed to delete workflow");
      },
    });
    setDeleteLoading(false);
    if (succeeded) {
      setDeleteOpen(false);
      setDeleteConfirmText("");
      fetchWorkflows(page + 1, limit, searchQuery, modifiedSort);
    } else if (errMsg) {
      setDeleteError(errMsg);
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

  const toggleModifiedSort = () => {
    setModifiedSort((current) => (current === "asc" ? "desc" : "asc"));
    setPage(0);
  };

  return (
    <Box>
      <PageHeader
        title="Workflows"
        subtitle="Manage your workflows"
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(0);
        }}
        searchPlaceholder="Search workflows…"
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Reload">
              <IconButton
                size="small"
                onClick={() =>
                  fetchWorkflows(page + 1, limit, searchQuery, modifiedSort)
                }
                disabled={listLoading}
                sx={{ color: "text.secondary" }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setNewForm({ name: "", description: "" });
                setNewError("");
                setNewOpen(true);
              }}
              sx={{
                borderRadius: "8px",
                fontWeight: 600,
                height: 36,
                whiteSpace: "nowrap",
              }}
            >
              New Workflow
            </Button>
          </Box>
        }
      />

      <Paper sx={{ overflow: "hidden", borderRadius: "10px" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: "25%", fontWeight: 600, fontSize: 12 }}>
                  Name
                </TableCell>
                <TableCell sx={{ width: "30%", fontWeight: 600, fontSize: 12 }}>
                  Description
                </TableCell>
                <TableCell
                  sortDirection={modifiedSort}
                  sx={{ fontWeight: 600, fontSize: 12 }}
                >
                  <TableSortLabel
                    active
                    direction={modifiedSort}
                    onClick={toggleModifiedSort}
                    sx={{ "& .MuiTableSortLabel-icon": { opacity: 1 } }}
                  >
                    Modified At
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listLoading ? (
                [0, 1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton variant="rounded" height={36} />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredWorkflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Typography
                        sx={{ fontSize: 13, color: "text.secondary" }}
                      >
                        {searchQuery.trim()
                          ? `No workflows match "${searchQuery}".`
                          : "No workflows yet."}
                      </Typography>
                      {searchQuery.trim() ? (
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
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setNewForm({ name: "", description: "" });
                            setNewError("");
                            setNewOpen(true);
                          }}
                          sx={{
                            mt: 2,
                            borderRadius: "8px",
                            borderColor: "divider",
                            color: "text.secondary",
                          }}
                        >
                          Create your first workflow
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkflows.map((wf) => {
                  const latestStatus = wf.latestVersion?.status ?? null;
                  const latestVersionId =
                    wf.latestVersion?.id ?? null;

                  return (
                    <TableRow
                      key={wf.id}
                      sx={{
                        "&:hover": { backgroundColor: "action.hover" },
                        transition: "background-color 0.1s",
                      }}
                      onClick={() => navigate(`/workflows/${wf.id}/versions`)}
                      style={{ cursor: "pointer" }}
                    >
                      <TableCell sx={{ py: 1.25 }}>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "text.primary",
                          }}
                        >
                          {wf.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 0, py: 1.25 }}>
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "text.secondary",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {wf.description || "-"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            color: "text.disabled",
                          }}
                        >
                          {formatDate(wf.modifiedAt)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="flex-end"
                          gap={0.25}
                        >
                          <Tooltip title="Create New Draft">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/workflows/${wf.id}/builder`);
                              }}
                              disabled={
                                latestStatus === "valid" ||
                                latestStatus === "draft"
                              }
                              sx={{
                                color: "text.disabled",
                                "&:hover": { color: "primary.main" },
                              }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Open Latest Version">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (latestVersionId) {
                                  navigate(
                                    `/workflows/${wf.id}/builder/${latestVersionId}`,
                                  );
                                }
                              }}
                              disabled={!latestVersionId}
                              sx={{
                                color: "text.disabled",
                                "&:hover": { color: "primary.main" },
                              }}
                            >
                              <AccountTreeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(wf);
                              }}
                              sx={{
                                color: "text.disabled",
                                "&:hover": { color: "primary.main" },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDelete(wf);
                              }}
                              sx={{
                                color: "text.disabled",
                                "&:hover": { color: "#ef4444" },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!listLoading && filteredWorkflows.length > 0 && (
          <Box
            px={2}
            py={1.25}
            borderTop="1px solid"
            sx={{ borderColor: "divider" }}
          >
            <Typography sx={{ fontSize: 12, color: "text.disabled" }}>
              {filteredWorkflows.length} workflow
              {filteredWorkflows.length !== 1 ? "s" : ""}
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
        open={newOpen}
        onClose={() => setNewOpen(false)}
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
          New Workflow
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <TextField
            fullWidth
            label="Name *"
            size="small"
            value={newForm.name}
            onChange={(e) =>
              setNewForm((p) => ({ ...p, name: e.target.value }))
            }
            sx={{
              mb: 1.5,
              "& .MuiOutlinedInput-root": { borderRadius: "8px" },
            }}
            autoFocus
          />
          <TextField
            fullWidth
            label="Description"
            size="small"
            multiline
            minRows={2}
            value={newForm.description}
            onChange={(e) =>
              setNewForm((p) => ({ ...p, description: e.target.value }))
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <DialogErrorAlert message={newError} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setNewOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={newLoading || !newForm.name.trim()}
            onClick={handleNewSubmit}
            sx={{ borderRadius: "8px", fontWeight: 600 }}
          >
            {newLoading ? <CircularProgress size={14} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
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
          Edit Workflow
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <TextField
            fullWidth
            label="Name *"
            size="small"
            value={editForm.name}
            onChange={(e) =>
              setEditForm((p) => ({ ...p, name: e.target.value }))
            }
            sx={{
              mb: 1.5,
              "& .MuiOutlinedInput-root": { borderRadius: "8px" },
            }}
            autoFocus
          />
          <TextField
            fullWidth
            label="Description"
            size="small"
            multiline
            minRows={2}
            value={editForm.description}
            onChange={(e) =>
              setEditForm((p) => ({ ...p, description: e.target.value }))
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <DialogErrorAlert message={editError} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setEditOpen(false)}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={editLoading || !editForm.name.trim()}
            onClick={handleEditSubmit}
            sx={{ borderRadius: "8px", fontWeight: 600 }}
          >
            {editLoading ? <CircularProgress size={14} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteOpen(false);
            setDeleteConfirmText("");
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}
      >
        <Box sx={{ px: 3, pt: 2.5, pb: 2.5 }}>
          <Typography
            sx={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              mb: 0.75,
            }}
          >
            Delete{" "}
            <Box component="span" sx={{ color: "#ef4444" }}>
              {deleteTarget?.name}
            </Box>
            ?
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: "text.secondary",
              mb: 2,
              lineHeight: 1.6,
            }}
          >
            This action is permanent and cannot be undone. Type{" "}
            <Box
              component="span"
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                backgroundColor: "rgba(239,68,68,0.08)",
                color: "#ef4444",
                px: 0.6,
                py: 0.1,
                borderRadius: "4px",
              }}
            >
              delete
            </Box>{" "}
            to confirm.
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="delete"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            disabled={deleteLoading}
            sx={{
              mb: deleteError ? 1.5 : 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                "& fieldset": {
                  borderColor:
                    deleteConfirmText === "delete" ? "#22c55e" : "divider",
                },
                "&:hover fieldset": {
                  borderColor:
                    deleteConfirmText === "delete" ? "#22c55e" : undefined,
                },
                "&.Mui-focused fieldset": {
                  borderColor:
                    deleteConfirmText === "delete" ? "#22c55e" : "#ef4444",
                },
              },
            }}
          />
          <DialogErrorAlert message={deleteError} />
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button
              size="small"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteConfirmText("");
              }}
              disabled={deleteLoading}
              sx={{ color: "text.secondary", borderRadius: "8px" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={deleteLoading || deleteConfirmText !== "delete"}
              onClick={handleDeleteConfirm}
              sx={{
                borderRadius: "8px",
                fontWeight: 600,
                backgroundColor: "#ef4444",
                color: "#fff",
                "&:hover": { backgroundColor: "#dc2626" },
                "&.Mui-disabled": {
                  backgroundColor: "rgba(239,68,68,0.25)",
                  color: "rgba(255,255,255,0.6)",
                },
              }}
            >
              {deleteLoading ? (
                <CircularProgress size={14} sx={{ color: "#fff" }} />
              ) : (
                "Delete"
              )}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
