import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Box, Button, Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { BackendTask } from '../../../types';

const MONO = "'JetBrains Mono', monospace";

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

interface Props {
  tasks: BackendTask[];
  loading?: boolean;
}

export default function TaskTable({ tasks, loading }: Props) {
  const navigate = useNavigate();

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary' } }}>
            <TableCell>Task Title</TableCell>
            <TableCell>Workflow</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right" sx={{ pr: 2 }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell colSpan={4}>
                  <Skeleton variant="rounded" height={36} />
                </TableCell>
              </TableRow>
            ))
          ) : tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4}>
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography color="text.secondary" fontSize={13}>
                    No pending tasks. Tasks waiting for manual review will appear here.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id} sx={{ '& td': { fontSize: 13, py: 1.25 } }}>
                <TableCell>
                  <Typography fontSize={13} fontWeight={500}>
                    {task.node_configuration?.title || 'Untitled Task'}
                  </Typography>
                  {task.node_configuration?.description && (
                    <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.25 }}>
                      {task.node_configuration.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography fontSize={13}>{task.workflow_name}</Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', mt: 0.25 }}>
                    {task.instance_id.slice(0, 8)}…
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography fontSize={12} color="text.secondary">
                    {formatDate(task.created_on)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ pr: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    Review Task
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
