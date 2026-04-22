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
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import StatusChip from "../../../components/common/StatusChip";
import type { InstanceListItem } from "../../../api/schemas/instance";
import { formatDate } from "../../../utils/formatUtils";

const MONO = "'JetBrains Mono', monospace";

function truncate(s: string, n = 8) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function formatSafeDate(s: string | null) {
  return s ? formatDate(s) : "-";
}

interface Props {
  instances: InstanceListItem[];
  loading?: boolean;
}

export default function InstanceTable({ instances, loading }: Props) {
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
            <TableCell>Instance ID</TableCell>
            <TableCell>Workflow</TableCell>
            <TableCell>Version</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Started</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton variant="rounded" height={36} />
                </TableCell>
              </TableRow>
            ))
          ) : instances.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography color="text.secondary" fontSize={13}>
                    No instances found. Create one to get started.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            instances.map((inst) => (
              <TableRow
                key={inst.id}
                hover
                onClick={() =>
                  navigate(`/instances/${inst.id}`, {
                    state: { instance: inst },
                  })
                }
                sx={{ cursor: "pointer", "& td": { fontSize: 13, py: 1.25 } }}
              >
                <TableCell>
                  <Typography sx={{ fontFamily: MONO, fontSize: 12 }}>
                    {truncate(inst.id, 12)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {inst.workflow_name ? (
                    <Typography fontSize={13}>{inst.workflow_name}</Typography>
                  ) : (
                    <Typography
                      sx={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: "text.secondary",
                      }}
                    >
                      {truncate(inst.workflow_version_id, 12)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography fontSize={13}>
                    {inst.version_number != null
                      ? `v${inst.version_number}`
                      : "-"}
                  </Typography>
                </TableCell>

                <TableCell>
                  <StatusChip
                    status={
                      inst.control_signal === "pause"
                        ? "pausing"
                        : inst.control_signal === "terminate"
                          ? "terminating"
                          : inst.status
                    }
                  />
                </TableCell>

                <TableCell>
                  <Typography fontSize={12} color="text.secondary">
                    {formatSafeDate(inst.started_on)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/audit/${inst.id}`);
                    }}
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: "8px",
                      height: 30,
                    }}
                  >
                    View Audits
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
