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
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);

  useEffect(() => {
    const handleFetch = async (pageNum = 1, pageSize = 20, assignee = '') => {
      const res = await fetch({
        page: pageNum,
        limit: pageSize,
        ...(assignee.trim() ? { assignee: assignee.trim() } : {}),
      });
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    };

    handleFetch(page + 1, limit, assigneeQuery);
  }, [page, limit, assigneeQuery, fetch]);

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
    setPage(0);
  };

  return (
    <Box>
      <PageHeader
        title="Pending Tasks"
        subtitle="Review and complete tasks waiting for manual approval"
        searchQuery={assigneeQuery}
        onSearchChange={(value) => {
          setAssigneeQuery(value);
          setPage(0);
        }}
        searchPlaceholder="Search by assignee…"
        action={
          <Tooltip title="Reload">
            <IconButton size="small" onClick={async () => {
              const res = await fetch({
                page: page + 1,
                limit,
                ...(assigneeQuery.trim() ? { assignee: assigneeQuery.trim() } : {}),
              });
              if (res?.pagination) {
                setPagination(res.pagination);
              }
            }} disabled={loading}
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
