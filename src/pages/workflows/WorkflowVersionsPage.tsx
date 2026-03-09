import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Skeleton,
  InputAdornment, TextField, Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { getWorkflow, getWorkflowVersions, publishVersion } from '../../api/workflowApi';
import { useApiCall } from '../../hooks/useApiCall';
import StatusChip from '../../components/common/StatusChip';
import type { Workflow, WorkflowVersion } from '../../types';

export default function WorkflowVersionsPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const { call } = useApiCall();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'deprecated'>('all');

  const [publishTarget, setPublishTarget] = useState<WorkflowVersion | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!workflowId) return;
    setLoading(true);
    try {
      const [wfRes, versRes] = await Promise.allSettled([
        call(() => getWorkflow(workflowId), { showError: false }),
        call(() => getWorkflowVersions(workflowId), { showError: false }),
      ]);

      if (wfRes.status === 'fulfilled' && wfRes.value) {
        const body = wfRes.value as { data?: Workflow };
        setWorkflow(body?.data || null);
      }
      if (versRes.status === 'fulfilled' && versRes.value) {
        const body = versRes.value as { data?: { versions?: WorkflowVersion[] } };
        const vers = body?.data?.versions || [];
        setVersions([...vers].sort((a, b) => (b.versionNumber ?? 0) - (a.versionNumber ?? 0)));
      }
    } finally {
      setLoading(false);
    }
  }, [workflowId, call]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePublish = async () => {
    if (!workflowId || !publishTarget) return;
    setPublishLoading(true);
    try {
      await call(
        () => publishVersion(workflowId, publishTarget.versionNumber),
        { successMsg: `Version v${publishTarget.versionNumber} published.` }
      );
      setPublishTarget(null);
      fetchData();
    } finally {
      setPublishLoading(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const versionStatus = (v: WorkflowVersion): string => {
    const s = v.status?.toLowerCase();
    if (s === 'active') return 'active';
    if (s === 'published') return 'published';
    if (s === 'draft') return 'draft';
    if (s === 'deprecated') return 'deprecated';
    return v.status || 'draft';
  };

  const filteredVersions = versions.filter(v => {
    const statusMatch = statusFilter === 'all' || versionStatus(v) === statusFilter;
    if (!statusMatch) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      `v${v.versionNumber}`.includes(q) ||
      versionStatus(v).toLowerCase().includes(q) ||
      (v.status?.toLowerCase() || '').includes(q) ||
      formatDate(v.publishedAt).toLowerCase().includes(q) ||
      formatDate(v.createdAt).toLowerCase().includes(q)
    );
  });

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="flex-start" gap={1.5} mb={3}>
        <IconButton
          onClick={() => navigate('/workflows')}
          size="small"
          sx={{ color: 'text.secondary', mt: 0.25 }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box flex={1} minWidth={0}>
          <Box display="flex" alignItems="center" gap={1} mb={0.25}>
            <Typography
              sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: 'text.primary', lineHeight: 1.2 }}
            >
              {workflow?.name || 'Version History'}
            </Typography>
            {!loading && versions.length > 0 && (
              <Chip
                label={`${versions.length} version${versions.length !== 1 ? 's' : ''}`}
                size="small"
                sx={{
                  fontSize: 10, height: 20, fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: 'action.selected', color: 'text.secondary',
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            )}
          </Box>
          {workflow?.description && (
            <Typography
              sx={{
                fontSize: 13, color: 'text.secondary',
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}
            >
              {workflow.description}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/workflows/${workflowId}/builder`)}
          sx={{ borderRadius: '8px', fontWeight: 600, height: 36, flexShrink: 0 }}
        >
          New Draft
        </Button>
      </Box>

      {/* Filter + Search row */}
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} mb={2.5}>
        <Box display="flex" gap={1}>
          {(['all', 'draft', 'published', 'deprecated'] as const).map(f => (
            <Button
              key={f}
              size="small"
              variant={statusFilter === f ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter(f)}
              sx={{
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: 12,
                textTransform: 'capitalize',
                height: 32,
                ...(statusFilter === f ? {} : {
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                }),
              }}
            >
              {f}
            </Button>
          ))}
        </Box>

        <TextField
          size="small"
          placeholder="Search all columns…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sx={{
            width: 300,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px', fontSize: 13,
              '& fieldset': { borderColor: 'divider' },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.25, color: 'text.disabled' }}>
                  <ClearIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 120 }}>Version</TableCell>
                <TableCell sx={{ width: 120 }}>Status</TableCell>
                <TableCell>Published</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right" sx={{ width: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [0, 1, 2].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton variant="rounded" height={36} />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredVersions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box py={6} textAlign="center">
                      {versions.length === 0 ? (
                        <>
                          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>No versions yet.</Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/workflows/${workflowId}/builder`)}
                            sx={{ mt: 2, borderRadius: '8px', borderColor: 'divider', color: 'text.secondary' }}
                          >
                            Create First Draft
                          </Button>
                        </>
                      ) : (
                        <>
                          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                            No versions match the current filter{searchQuery ? ` or search` : ''}.
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
                            sx={{ mt: 1.5, borderRadius: '8px', color: 'text.secondary', fontSize: 12 }}
                          >
                            Clear filters
                          </Button>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVersions.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell>
                      <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'text.primary', fontWeight: 600 }}>
                        v{v.versionNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={versionStatus(v)} />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'text.disabled' }}>
                        {formatDate(v.publishedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'text.disabled' }}>
                        {formatDate(v.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.25}>
                        <Tooltip title="Open in Builder">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/workflows/${workflowId}/builder/${v.versionNumber}`)}
                            sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {v.status?.toLowerCase() === 'draft' && (
                          <Tooltip title="Publish this version">
                            <IconButton
                              size="small"
                              onClick={() => setPublishTarget(v)}
                              sx={{ color: 'text.disabled', '&:hover': { color: '#22c55e' } }}
                            >
                              <PublishIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Results count footer */}
        {!loading && versions.length > 0 && (
          <Box px={2} py={1.25} borderTop="1px solid" sx={{ borderColor: 'divider' }}>
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
              {filteredVersions.length === versions.length
                ? `${versions.length} version${versions.length !== 1 ? 's' : ''}`
                : `${filteredVersions.length} of ${versions.length} version${versions.length !== 1 ? 's' : ''}`}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Publish confirmation dialog */}
      <Dialog open={!!publishTarget} onClose={() => { if (!publishLoading) setPublishTarget(null); }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Publish v{publishTarget?.versionNumber}?
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Publishing this version will make it the active version for this workflow.
            Any previously active version will be deprecated.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setPublishTarget(null)} disabled={publishLoading} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={publishLoading}
            onClick={handlePublish}
            sx={{ borderRadius: '8px', fontWeight: 600, backgroundColor: '#22c55e', color: '#fff', '&:hover': { backgroundColor: '#16a34a' } }}
          >
            {publishLoading ? <CircularProgress size={14} /> : 'Publish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
