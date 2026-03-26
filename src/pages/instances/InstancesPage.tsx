import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, IconButton, Paper, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import AppPagination from '../../components/common/AppPagination';
import InstanceTable from './components/InstanceTable';
import CreateInstanceDialog from './components/CreateInstanceDialog';
import { useInstances } from './hooks/useInstances';
import type { InstanceListItem } from '../../api/schemas/instance';
import type { Pagination } from '../../api/schemas/common';

export default function InstancesPage() {
  const navigate = useNavigate();
  const { instances, loading, fetch } = useInstances();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const handleFetch = async (pageNum = 1, pageSize = 20) => {
    const res = await fetch({ page: pageNum, limit: pageSize });
    if (res?.pagination) {
      setPagination(res.pagination);
    }
  };

  useEffect(() => { handleFetch(page + 1, limit); }, []);

  const handlePageChange = (_event: unknown, newPage: number) => {
    const newPageNum = newPage + 1;
    setPage(newPage);
    handleFetch(newPageNum, limit);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
    setPage(0);
    handleFetch(1, newLimit);
  };

  const handleCreated = (instance: InstanceListItem) => {
    navigate(`/instances/${instance.id}`, { state: { instance } });
  };

  return (
    <Box>
      <PageHeader
        title="Instances"
        subtitle="Monitor all running and completed workflow instances"
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Reload">
              <IconButton size="small" onClick={() => handleFetch(page + 1, limit)} disabled={loading}
                sx={{ color: 'text.secondary' }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Create Instance
            </Button>
          </Box>
        }
      />

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <InstanceTable instances={instances} loading={loading} />
        <AppPagination
          pagination={pagination}
          page={page}
          rowsPerPage={limit}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[20, 50, 100]}
        />
      </Paper>

      <CreateInstanceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </Box>
  );
}
