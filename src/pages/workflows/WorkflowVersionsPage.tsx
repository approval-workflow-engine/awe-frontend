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
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import BoltIcon from '@mui/icons-material/Bolt';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { getWorkflow, validateVersion, updateVersionStatus } from '../../api/workflowApi';
import { useApiCall } from '../../hooks/useApiCall';
import StatusChip from '../../components/common/StatusChip';
import type { Workflow, WorkflowVersion } from '../../types';

type LifecycleAction = 'validate' | 'commit' | 'activate' | 'deactivate';

const ACTION_CONFIG: Record<LifecycleAction, {
  title: (vn: number) => string;
  body: string;
  confirmLabel: string;
  confirmColor: string;
}> = {
  validate: {
    title: vn => `Validate v${vn}?`,
    body: 'Run validation checks on this version.',
    confirmLabel: 'Validate',
    confirmColor: '#06b6d4',
  },
  commit: {
    title: vn => `Commit v${vn}?`,
    body: 'Locking this version marks it as ready for activation.',
    confirmLabel: 'Commit',
    confirmColor: '#f59e0b',
  },
  activate: {
    title: vn => `Activate v${vn}?`,
    body: 'This will make the selected version the live version.',
    confirmLabel: 'Activate',
    confirmColor: '#22c55e',
  },
  deactivate: {
    title: vn => `Deactivate v${vn}?`,
    body: 'Move version back to committed status.',
    confirmLabel: 'Deactivate',
    confirmColor: '#ef4444',
  },
};

export default function WorkflowVersionsPage() {

  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const { call } = useApiCall();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [actionTarget, setActionTarget] =
    useState<{ version: WorkflowVersion; action: LifecycleAction } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {

    if (!workflowId) return;

    setLoading(true);

    try {

      const res = await call(() => getWorkflow(workflowId), { showError: false });

      if (res) {

        const wfBody = res as { workflow?: Workflow } | Workflow;
        const wf = (wfBody as { workflow?: Workflow }).workflow ?? (wfBody as Workflow);

        setWorkflow(wf || null);

        const rawVersions: Array<Record<string, unknown>> =
          Array.isArray((wf as any)?.versions) ? (wf as any).versions : [];

        const normalized = rawVersions.map(v => ({
          ...v,
          versionNumber:
            (v.versionNumber as number | undefined) ??
            (v.version as number | undefined) ??
            0,
        })) as WorkflowVersion[];

        setVersions([...normalized].sort((a, b) => b.versionNumber - a.versionNumber));
      }

    } finally {
      setLoading(false);
    }

  }, [workflowId, call]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const normalizeStatus = (v: WorkflowVersion) =>
    (v.status?.toLowerCase?.() || 'draft');

  const hasDraft = versions.some(v => normalizeStatus(v) === 'draft');

  const handleAction = async () => {

    if (!workflowId || !actionTarget) return;

    const { version, action } = actionTarget;

    setActionLoading(true);

    try {

      if (action === 'validate') {
        await call(() =>
          validateVersion(workflowId, version.versionNumber)
        );
      }

      if (action === 'commit') {
        await call(() =>
          updateVersionStatus(workflowId, version.versionNumber, 'published')
        );
      }

      if (action === 'activate') {
        await call(() =>
          updateVersionStatus(workflowId, version.versionNumber, 'active')
        );
      }

      if (action === 'deactivate') {
        await call(() =>
          updateVersionStatus(workflowId, version.versionNumber, 'published')
        );
      }

      setActionTarget(null);
      fetchData();

    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-';

    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  const filteredVersions = versions.filter(v => {

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const st = normalizeStatus(v);

    return (
      `v${v.versionNumber}`.includes(q) ||
      st.includes(q) ||
      formatDate(v.createdAt).toLowerCase().includes(q)
    );
  });

  const cfg = actionTarget ? ACTION_CONFIG[actionTarget.action] : null;

  return (
    <Box>

      {/* Header */}

      <Box display="flex" alignItems="center" gap={2} mb={3}>

        <IconButton
          onClick={() => navigate('/workflows')}
          size="small"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Box flex={1}>

          <Box display="flex" alignItems="center" gap={1}>

            <Typography fontWeight={700} fontSize={20}>
              {workflow?.name || 'Version History'}
            </Typography>

            {!loading && versions.length > 0 && (
              <Chip
                label={`${versions.length} version${versions.length !== 1 ? 's' : ''}`}
                size="small"
              />
            )}

          </Box>

          {workflow?.description && (
            <Typography fontSize={13} color="text.secondary">
              {workflow.description}
            </Typography>
          )}

        </Box>

        {/* Search */}

        <TextField
          size="small"
          placeholder="Search all columns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {/* New Draft */}

        <Tooltip title={hasDraft ? 'Draft already exists' : ''}>
          <span>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={hasDraft}
              onClick={() => navigate(`/workflows/${workflowId}/builder`)}
            >
              New Draft
            </Button>
          </span>
        </Tooltip>

      </Box>

      {/* Table */}

      <Paper>

        <TableContainer>

          <Table size="small">

            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>

              {loading ? (

                [1,2,3].map(i => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton height={36} />
                    </TableCell>
                  </TableRow>
                ))

              ) : (

                filteredVersions.map(v => {

                  const st = normalizeStatus(v);
                  const isDraft = st === 'draft';
                  const isValid = st === 'valid';
                  const isCommitted = st === 'published';

                  return (

                    <TableRow key={v.id} hover>

                      <TableCell>v{v.versionNumber}</TableCell>

                      <TableCell>
                        <StatusChip status={st}/>
                      </TableCell>

                      <TableCell>
                        {formatDate(v.createdAt)}
                      </TableCell>

                      <TableCell align="right">

                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(`/workflows/${workflowId}/builder/${v.versionNumber}`)
                          }
                        >
                          {(isDraft || isValid)
                            ? <EditIcon fontSize="small"/>
                            : <VisibilityIcon fontSize="small"/>
                          }
                        </IconButton>

                        {isDraft && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              setActionTarget({version:v, action:'validate'})
                            }
                          >
                            <CheckCircleOutlineIcon fontSize="small"/>
                          </IconButton>
                        )}

                        {(isDraft || isValid) && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              setActionTarget({version:v, action:'commit'})
                            }
                          >
                            <LockOutlinedIcon fontSize="small"/>
                          </IconButton>
                        )}

                        {isCommitted && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              setActionTarget({version:v, action:'activate'})
                            }
                          >
                            <BoltIcon fontSize="small"/>
                          </IconButton>
                        )}

                        {st === 'active' && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              setActionTarget({version:v, action:'deactivate'})
                            }
                          >
                            <PowerSettingsNewIcon fontSize="small"/>
                          </IconButton>
                        )}

                      </TableCell>

                    </TableRow>
                  );
                })

              )}

            </TableBody>

          </Table>

        </TableContainer>

      </Paper>

      {/* Action Dialog */}

      <Dialog open={!!actionTarget}>

        {actionTarget && cfg && (
          <>
            <DialogTitle>
              {cfg.title(actionTarget.version.versionNumber)}
            </DialogTitle>

            <DialogContent>
              <Typography>
                {cfg.body}
              </Typography>
            </DialogContent>

            <DialogActions>

              <Button
                onClick={() => setActionTarget(null)}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handleAction}
              >
                {actionLoading
                  ? <CircularProgress size={16}/>
                  : cfg.confirmLabel}
              </Button>

            </DialogActions>
          </>
        )}

      </Dialog>

    </Box>
  );
}
