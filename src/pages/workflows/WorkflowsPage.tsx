import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Pagination, CircularProgress, Switch, Skeleton,
  Select, MenuItem, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import {
  getWorkflows, createWorkflow, updateWorkflow,
  deleteWorkflow,
} from '../../api/workflowApi';
import { createInstance as startInstance } from '../../api/instanceApi';
import { useApiCall } from '../../hooks/useApiCall';
import { extractApiError } from '../../utils/apiError';
import DialogErrorAlert from '../../components/common/DialogErrorAlert';
import type { Workflow } from '../../types';

type LaunchInput = { name: string; datatype: 'string' | 'number' | 'boolean' | 'object'; value: string; };

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { call } = useApiCall();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  // Filter is fixed to 'all' — no filter UI is shown, so no state needed.
  const filter = 'all';
  const [listLoading, setListLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allWorkflows, setAllWorkflows] = useState<Workflow[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  // Dialog states
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', description: '' });
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Workflow | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [launchOpen, setLaunchOpen] = useState(false);
  const [launchTarget, setLaunchTarget] = useState<Workflow | null>(null);
  const [launchInputs, setLaunchInputs] = useState<LaunchInput[]>([]);
  const [launchAutoAdvance, setLaunchAutoAdvance] = useState(true);
  const [launchLoading, setLaunchLoading] = useState(false);
  const [launchError, setLaunchError] = useState('');

  const PAGE_SIZE = 20;

  const fetchWorkflows = useCallback(async (pg: number, f: string) => {
    setListLoading(true);
    try {
      const params: Record<string, unknown> = { page: pg, limit: PAGE_SIZE };
      if (f !== 'all') params.status = f;
      const res = await call(() => getWorkflows(params));
      if (res) {
        const body = res as {
          workflows?: Workflow[];
          pagination?: { total: number };
          data?: Workflow[];
        };
        // Handle both { workflows, pagination } and array directly
        const list = body?.workflows ?? (Array.isArray(body) ? (body as unknown as Workflow[]) : []);
        const deduped = list.filter((wf, idx, self) => self.findIndex(w => w.id === wf.id) === idx);
        setWorkflows(deduped);
        setTotal(body?.pagination?.total || 0);
      }
    } finally {
      setListLoading(false);
    }
  }, [call]);

  useEffect(() => { fetchWorkflows(page, filter); }, [page, filter, fetchWorkflows]);

  // Fetch all workflows for client-side search
  const fetchAllWorkflows = useCallback(async (f: string) => {
    setSearchLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, limit: 1000 };
      if (f !== 'all') params.status = f;
      const res = await call(() => getWorkflows(params));
      if (res) {
        const body = res as { workflows?: Workflow[] };
        const list = body?.workflows ?? (Array.isArray(body) ? (body as unknown as Workflow[]) : []);
        const deduped = list.filter((wf, idx, self) => self.findIndex(w => w.id === wf.id) === idx);
        setAllWorkflows(deduped);
      }
    } finally {
      setSearchLoading(false);
    }
  }, [call]);

  // Load full dataset when user starts searching
  useEffect(() => {
    if (searchQuery.trim() && allWorkflows === null) {
      fetchAllWorkflows(filter);
    }
  }, [searchQuery, allWorkflows, filter, fetchAllWorkflows]);


    //  New Workflow
  const handleNewSubmit = async () => {
    if (!newForm.name.trim()) return;
    setNewLoading(true);
    setNewError('');
    const res = await call(
      () => createWorkflow({ name: newForm.name.trim(), description: newForm.description.trim() || undefined }),
      {
        showError: false,
        onError: (err) => {
          setNewError(extractApiError(err, 'Failed to create workflow'));
        },
      }
    );
    setNewLoading(false);
    if (res) {
      setNewOpen(false);
      setNewForm({ name: '', description: '' });
      fetchWorkflows(1, filter);
      setPage(1);
    }
  };

  //  Edit Workflow
  const openEdit = (wf: Workflow) => {
    setEditTarget(wf);
    setEditForm({ name: wf.name, description: wf.description || '' });
    setEditError('');
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editTarget || !editForm.name.trim()) return;
    setEditLoading(true);
    setEditError('');
    const res = await call(
      () => updateWorkflow(editTarget.id, { name: editForm.name.trim(), description: editForm.description.trim() || undefined }),
      {
        showError: false,
        onError: (err) => {
          setEditError(extractApiError(err, 'Failed to update workflow'));
        },
      }
    );
    setEditLoading(false);
    if (res) {
      setEditOpen(false);
      fetchWorkflows(page, filter);
    }
  };

  //  Delete Workflow
  const openDelete = (wf: Workflow) => {
    setDeleteTarget(wf);
    setDeleteError('');
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    let succeeded = false;
    let errMsg = '';
    await call(
      () => deleteWorkflow(deleteTarget.id),
      {
        showError: false,
        onSuccess: () => { succeeded = true; },
        onError: (err) => {
          errMsg = extractApiError(err, 'Failed to delete workflow');
        },
      }
    );
    setDeleteLoading(false);
    if (succeeded) {
      setDeleteOpen(false);
      fetchWorkflows(page, filter);
    } else if (errMsg) {
      setDeleteError(errMsg);
    }
  };

  //  Launch Instance
  const openLaunch = (wf: Workflow) => {
    setLaunchTarget(wf);
    setLaunchInputs([]);
    setLaunchAutoAdvance(true);
    setLaunchError('');
    setLaunchOpen(true);
  };

  const handleLaunchSubmit = async () => {
    if (!launchTarget) return;
    setLaunchLoading(true);
    setLaunchError('');
    // Build context object from structured inputs
    const context: Record<string, unknown> = {};
    for (const inp of launchInputs) {
      const key = inp.name.trim();
      if (!key) continue;
      if (inp.datatype === 'number') {
        context[key] = inp.value.trim() === '' ? 0 : Number(inp.value);
      } else if (inp.datatype === 'boolean') {
        context[key] = inp.value === 'true';
      } else if (inp.datatype === 'object') {
        try { context[key] = JSON.parse(inp.value); }
        catch { setLaunchError(`"${key}" must be valid JSON for object type.`); setLaunchLoading(false); return; }
      } else {
        context[key] = inp.value;
      }
    }
    const contextToSend = launchInputs.some(i => i.name.trim()) ? context : undefined;
    const res = await call(
      () => startInstance({ workflowId: launchTarget.id, context: contextToSend, autoAdvance: launchAutoAdvance }),
      {
        showError: false,
        onError: (err) => {
          setLaunchError(extractApiError(err, 'Failed to start instance'));
        },
      }
    );
    setLaunchLoading(false);
    if (res) {
      const body = res as { instance?: { id: string }; id?: string; instanceId?: string };
      const instanceId = body?.instance?.id ?? body?.instanceId ?? body?.id;
      setLaunchOpen(false);
      if (instanceId) navigate(`/instances/${instanceId}`);
      else navigate('/instances');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isSearchActive = searchQuery.trim().length > 0;
  const displayedWorkflows = isSearchActive
    ? (allWorkflows || []).filter(wf => {
      const q = searchQuery.toLowerCase();
      const updatedDate = wf.updatedAt
        ? new Date(wf.updatedAt as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
        : '';
      const createdDate = wf.createdAt
        ? new Date(wf.createdAt as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
        : '';
      return (
        wf.name.toLowerCase().includes(q) ||
        (wf.description || '').toLowerCase().includes(q) ||
        updatedDate.toLowerCase().includes(q) ||
        createdDate.toLowerCase().includes(q)
      );
    })
    : workflows;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2.5}>
        <Box>
          <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: 'text.primary' }}>
            Workflows
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Manage your workflows
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1.5}>
          <TextField
            size="small"
            placeholder="Search workflows…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            sx={{
              width: 260,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px', fontSize: 13,
                '& fieldset': { borderColor: 'divider' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {searchLoading
                    ? <CircularProgress size={14} sx={{ color: 'text.disabled' }} />
                    : <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => { setSearchQuery(''); setAllWorkflows(null); }}
                    sx={{ p: 0.25, color: 'text.disabled' }}
                  >
                    <ClearIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setNewForm({ name: '', description: '' }); setNewError(''); setNewOpen(true); }}
            sx={{ borderRadius: '8px', fontWeight: 600, height: 36, whiteSpace: 'nowrap' }}
          >
            New Workflow
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <Paper sx={{ overflow: 'hidden', borderRadius: '10px' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '25%', fontWeight: 600, fontSize: 12 }}>Name</TableCell>
                <TableCell sx={{ width: '30%', fontWeight: 600, fontSize: 12 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Date Created</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Last Modified</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(listLoading || (isSearchActive && searchLoading)) ? (
                [0, 1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton variant="rounded" height={36} />
                    </TableCell>
                  </TableRow>
                ))
              ) : displayedWorkflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                        {isSearchActive
                          ? `No workflows match "${searchQuery}".`
                          : filter === 'all' ? 'No workflows yet.' : `No ${filter} workflows.`}
                      </Typography>
                      {isSearchActive ? (
                        <Button
                          size="small"
                          onClick={() => { setSearchQuery(''); setAllWorkflows(null); }}
                          sx={{ mt: 1.5, borderRadius: '8px', color: 'text.secondary', fontSize: 12 }}
                        >
                          Clear search
                        </Button>
                      ) : filter === 'all' && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => { setNewForm({ name: '', description: '' }); setNewError(''); setNewOpen(true); }}
                          sx={{ mt: 2, borderRadius: '8px', borderColor: 'divider', color: 'text.secondary' }}
                        >
                          Create your first workflow
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayedWorkflows.map(wf => (
                  <TableRow key={wf.id} sx={{ '&:hover': { backgroundColor: 'action.hover' }, transition: 'background-color 0.1s' }}>
                    <TableCell sx={{ py: 1.25 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
                        {wf.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 0, py: 1.25 }}>
                      <Typography sx={{
                        fontSize: 12, color: 'text.secondary',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {wf.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'text.disabled' }}>
                        {wf.createdAt ? new Date(wf.createdAt as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'text.disabled' }}>
                        {wf.updatedAt ? new Date(wf.updatedAt as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.25}>
                        {/* Builder */}
                        <Tooltip title="Open Builder">
                          <IconButton size="small" onClick={() => navigate(`/workflows/${wf.id}/builder`)} sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
                            <AccountTreeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Versions */}
                        <Tooltip title="Version History">
                          <IconButton size="small" onClick={() => navigate(`/workflows/${wf.id}/versions`)} sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Edit */}
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(wf)} sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Launch instance (active only) */}
                        {wf.status === 'active' && (
                          <Tooltip title="Start Instance">
                            <IconButton size="small" onClick={() => openLaunch(wf)} sx={{ color: 'text.disabled', '&:hover': { color: '#06b6d4' } }}>
                              <RocketLaunchIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Delete */}
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => openDelete(wf)} sx={{ color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination / results footer */}
        {isSearchActive ? (
          !searchLoading && (allWorkflows || []).length > 0 && (
            <Box px={2} py={1.25} borderTop="1px solid" sx={{ borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                {displayedWorkflows.length} of {(allWorkflows || []).length} workflow{(allWorkflows || []).length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )
        ) : (
          total > 0 && (
            <Box display="flex" alignItems="center" justifyContent="space-between" py={1.5} px={2} borderTop="1px solid" sx={{ borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                Page {page} of {totalPages}
              </Typography>
              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  size="small"
                  sx={{
                    '& .MuiPaginationItem-root': { color: 'text.secondary', borderColor: 'divider' },
                    '& .Mui-selected': { backgroundColor: 'rgba(79,110,247,0.15) !important', color: 'primary.main' },
                  }}
                />
              )}
            </Box>
          )
        )}
      </Paper>

      {/*  New Workflow Dialog  */}
      <Dialog open={newOpen} onClose={() => setNewOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          New Workflow
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            fullWidth
            label="Name *"
            size="small"
            value={newForm.name}
            onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))}
            sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            autoFocus
          />
          <TextField
            fullWidth
            label="Description"
            size="small"
            multiline
            minRows={2}
            value={newForm.description}
            onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
          <DialogErrorAlert message={newError} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setNewOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" size="small" disabled={newLoading || !newForm.name.trim()} onClick={handleNewSubmit}
            sx={{ borderRadius: '8px', fontWeight: 600 }}>
            {newLoading ? <CircularProgress size={14} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/*  Edit Workflow Dialog  */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Edit Workflow
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            fullWidth
            label="Name *"
            size="small"
            value={editForm.name}
            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
            sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            autoFocus
          />
          <TextField
            fullWidth
            label="Description"
            size="small"
            multiline
            minRows={2}
            value={editForm.description}
            onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
          <DialogErrorAlert message={editError} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setEditOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" size="small" disabled={editLoading || !editForm.name.trim()} onClick={handleEditSubmit}
            sx={{ borderRadius: '8px', fontWeight: 600 }}>
            {editLoading ? <CircularProgress size={14} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/*  Delete Dialog  */}
      <Dialog open={deleteOpen} onClose={() => { if (!deleteLoading) setDeleteOpen(false); }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#ef4444' }}>
          Delete Workflow?
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </Typography>
          <DialogErrorAlert message={deleteError} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setDeleteOpen(false)} disabled={deleteLoading} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" size="small" disabled={deleteLoading} onClick={handleDeleteConfirm}
            sx={{ borderRadius: '8px', fontWeight: 600, backgroundColor: '#ef4444', '&:hover': { backgroundColor: '#dc2626' } }}>
            {deleteLoading ? <CircularProgress size={14} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/*  Launch Instance Dialog  */}
      <Dialog open={launchOpen} onClose={() => { if (!launchLoading) setLaunchOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Start Instance - {launchTarget?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1.5 }}>
            Provide initial context values for this instance (optional).
          </Typography>

          {/* Input rows */}
          {launchInputs.length > 0 && (
            <Box display="flex" flexDirection="column" gap={1} mb={1.5}>
              {launchInputs.map((inp, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    p: 1.5, borderRadius: '8px',
                    backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider',
                  }}
                >
                  <TextField
                    size="small"
                    placeholder="Variable name"
                    value={inp.name}
                    onChange={e => setLaunchInputs(prev => prev.map((r, idx) => idx === i ? { ...r, name: e.target.value } : r))}
                    sx={{ flex: 2, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 } }}
                  />
                  <Select
                    size="small"
                    value={inp.datatype}
                    onChange={e => setLaunchInputs(prev => prev.map((r, idx) => idx === i ? { ...r, datatype: e.target.value as LaunchInput['datatype'], value: '' } : r))}
                    sx={{ flex: 1, borderRadius: '6px', fontSize: 12 }}
                  >
                    {(['string', 'number', 'boolean', 'object'] as const).map(t => (
                      <MenuItem key={t} value={t} sx={{ fontSize: 12 }}>{t}</MenuItem>
                    ))}
                  </Select>
                  {inp.datatype === 'boolean' ? (
                    <Select
                      size="small"
                      value={inp.value || 'true'}
                      onChange={e => setLaunchInputs(prev => prev.map((r, idx) => idx === i ? { ...r, value: e.target.value } : r))}
                      sx={{ flex: 2, borderRadius: '6px', fontSize: 12 }}
                    >
                      <MenuItem value="true" sx={{ fontSize: 12 }}>true</MenuItem>
                      <MenuItem value="false" sx={{ fontSize: 12 }}>false</MenuItem>
                    </Select>
                  ) : (
                    <TextField
                      size="small"
                      placeholder={inp.datatype === 'object' ? '{"key":"value"}' : inp.datatype === 'number' ? '0' : 'value'}
                      value={inp.value}
                      onChange={e => setLaunchInputs(prev => prev.map((r, idx) => idx === i ? { ...r, value: e.target.value } : r))}
                      sx={{ flex: 2, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontFamily: inp.datatype === 'object' ? "'JetBrains Mono', monospace" : 'inherit', fontSize: 12 } }}
                    />
                  )}
                  <IconButton
                    size="small"
                    onClick={() => setLaunchInputs(prev => prev.filter((_, idx) => idx !== i))}
                    sx={{ color: '#ef4444', flexShrink: 0, p: 0.25 }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          <Button
            size="small"
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={() => setLaunchInputs(prev => [...prev, { name: '', datatype: 'string', value: '' }])}
            sx={{ borderRadius: '8px', borderColor: 'divider', color: 'text.secondary', fontSize: 12 }}
          >
            Add Input
          </Button>

          <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}
            sx={{ p: 1.5, borderRadius: '8px', backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>Auto Advance</Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Automatically execute automated nodes on start</Typography>
            </Box>
            <Switch
              checked={launchAutoAdvance}
              onChange={e => setLaunchAutoAdvance(e.target.checked)}
              size="small"
            />
          </Box>

          <DialogErrorAlert message={launchError} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setLaunchOpen(false)} disabled={launchLoading} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained"
            size="small"
            disabled={launchLoading}
            onClick={handleLaunchSubmit}
            sx={{ borderRadius: '8px', fontWeight: 600 }}
          >
            {launchLoading ? <CircularProgress size={14} /> : 'Start'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
