import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Skeleton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { PendingUserTask } from "../../../api/schemas/task";

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface Props {
  tasks: PendingUserTask[];
  loading?: boolean;
}

export default function TaskTable({ tasks, loading }: Props) {
  const navigate = useNavigate();

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow
            sx={{
              "& th": {
                fontWeight: 700,
                fontSize: 12,
                color: "text.secondary",
              },
            }}
          >
            <TableCell>Task Title</TableCell>
            <TableCell>Workflow</TableCell>
            {/* <TableCell>Version</TableCell> */}
            <TableCell>Assignee</TableCell>
            <TableCell>Created</TableCell>
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
              <TableCell colSpan={5}>
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography color="text.secondary" fontSize={13}>
                    No pending tasks. Tasks waiting for manual review will
                    appear here.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow
                key={task.id}
                sx={{ "& td": { fontSize: 13, py: 1.25 } }}
                onClick={() => navigate(`/tasks/${task.id}`)}
                hover style={{ cursor: "pointer" }}
              >
                <TableCell>
                  <Typography fontSize={13} fontWeight={500}>
                    {task.title || "Untitled Task"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography fontSize={13}>{task.workflow.name ?? '—'}</Typography>
                </TableCell>
                {/* <TableCell>
                  <Typography fontSize={12} color="text.secondary" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {task.workflow.versionId ? task.workflow.versionId.slice(-8) : '-'}
                  </Typography>
                </TableCell> */}
                <TableCell>
                  <Typography
                    fontSize={13}
                    color={task.assignee ? "text.primary" : "text.secondary"}
                  >
                    {task.assignee || "Unassigned"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography fontSize={12} color="text.secondary">
                    {formatDate(task.createdAt)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
