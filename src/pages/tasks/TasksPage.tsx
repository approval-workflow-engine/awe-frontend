import { useEffect, useState } from 'react';
import { Box, IconButton, Paper, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageHeader from '../../components/common/PageHeader';
import AppPagination from '../../components/common/AppPagination';
import TaskTable from './components/TaskTable';
import { useTasks } from './hooks/useTasks';
import type { Pagination } from '../../api/schemas/common';

export default function TasksPage() {
  const { tasks, loading, fetch } = useTasks();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const handleFetch = async (pageNum = 1, pageSize = 20) => {
    const res = await fetch({ page: pageNum, limit: pageSize });
    if (res?.pagination) {
      setPagination(res.pagination);
    }
  };

  useEffect(() => { 
    handleFetch(page + 1, limit); 
  }, []);

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

  return (
    <Box>
      <PageHeader
        title="Pending Tasks"
        subtitle="Review and complete tasks waiting for manual approval"
        action={
          <Tooltip title="Reload">
            <IconButton size="small" onClick={() => handleFetch(page + 1, limit)} disabled={loading}
              sx={{ color: 'text.secondary' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      />
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <TaskTable tasks={tasks} loading={loading} />
        <AppPagination
          pagination={pagination}
          page={page}
          rowsPerPage={limit}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[20, 50, 100]}
        />
      </Paper>
    </Box>
  );
}
