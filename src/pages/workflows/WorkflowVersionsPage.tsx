import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import AddIcon from '@mui/icons-material/Add';
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
        // Sort descending by version number
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
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Map version status to StatusChip status
  const versionStatus = (v: WorkflowVersion): string => {
    const s = v.status?.toLowerCase();
    if (s === 'active' || s === 'published') return 'active';
    if (s === 'draft') return 'draft';
    if (s === 'deprecated') return 'deprecated';
    return v.status || 'draft';
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <IconButton onClick={() => navigate('/workflows')} size="small" sx={{ color: 'text.secondary' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: 'text.primary' }}>
            {workflow?.name || 'Workflow Versions'}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Version history
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/workflows/${workflowId}/builder`)}
          sx={{ borderRadius: '8px', fontWeight: 600, height: 36 }}
        >
          New Draft
        </Button>
      </Box>

      <Paper sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Version</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Published</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box py={6} textAlign="center">
                        <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>No versions yet.</Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/workflows/${workflowId}/builder`)}
                          sx={{ mt: 2, borderRadius: '8px', borderColor: 'divider', color: 'text.secondary' }}
                        >
                          Create First Draft
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  versions.map(v => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'text.primary', fontWeight: 600 }}>
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
                          {(v.status?.toLowerCase() === 'draft') && (
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
