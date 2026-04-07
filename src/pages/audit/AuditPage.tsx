import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import AppPagination from '../../components/common/AppPagination';
import { useInstances } from '../instances/hooks/useInstances';
import { formatDate } from '../../utils/formatUtils';
import type { Pagination } from '../../api/schemas/common';

const MONO = "'JetBrains Mono', monospace";

function truncate(s: string, n = 12) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function safeDate(val: string | null | undefined) {
  return val ? formatDate(val) : '—';
}

export default function AuditPage() {
  const navigate = useNavigate();
  const { instances, loading, fetch } = useInstances();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  useEffect(() => {
    const handleFetch = async (pageNum = 1, pageSize = 20) => {
      const res = await fetch({ page: pageNum, limit: pageSize });
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    };
    handleFetch(page + 1, limit);
  }, [page, limit, fetch]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return instances;
    return instances.filter((inst) =>
      (inst.workflow_name ?? '').toLowerCase().includes(q) ||
      inst.id.toLowerCase().includes(q) ||
      inst.status.toLowerCase().includes(q)
    );
  }, [instances, search]);

  const handlePageChange = async (_event: unknown, newPage: number) => {
    const newPageNum = newPage + 1;
    setPage(newPage);
    const res = await fetch({ page: newPageNum, limit });
    if (res?.pagination) {
      setPagination(res.pagination);
    }
  };

  const handleChangeRowsPerPage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
    setPage(0);
    const res = await fetch({ page: 1, limit: newLimit });
    if (res?.pagination) {
      setPagination(res.pagination);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Audit Log"
        subtitle="View full execution history for any workflow instance"
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by workflow, instance ID or status…"
        action={
          <Tooltip title="Reload">
            <IconButton
              size="small"
              onClick={async () => {
                const res = await fetch({ page: page + 1, limit });
                if (res?.pagination) {
                  setPagination(res.pagination);
                }
              }}
              disabled={loading}
              sx={{ color: 'text.secondary' }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      />

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary' } }}>
                <TableCell>Instance ID</TableCell>
                <TableCell>Workflow</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Ended</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && [0, 1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton variant="rounded" height={36} />
                  </TableCell>
                </TableRow>
              ))}

              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography color="text.secondary" fontSize={13}>
                        {search ? 'No instances match your search.' : 'No instances found.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading && filtered.map((inst) => (
                <TableRow
                  key={inst.id}
                  hover
                  onClick={() => navigate(`/audit/${inst.id}`)}
                  sx={{ cursor: 'pointer', '& td': { fontSize: 13, py: 1.25 } }}
                >
                  <TableCell>
                    <Typography sx={{ fontFamily: MONO, fontSize: 12 }}>
                      {truncate(inst.id, 12)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13}>
                      {inst.workflow_name ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13}>
                      {inst.version_number != null ? `v${inst.version_number}` : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={inst.status} />
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={12} color="text.secondary">
                      {safeDate(inst.started_on)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={12} color="text.secondary">
                      {safeDate(inst.ended_on)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <AppPagination
          pagination={pagination}
          page={page}
          rowsPerPage={limit}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}