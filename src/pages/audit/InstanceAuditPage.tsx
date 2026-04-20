import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Skeleton,
  IconButton,
  Tooltip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PageHeader from "../../components/common/PageHeader";
import StatusChip from "../../components/common/StatusChip";
import { useApiCall } from "../../hooks/useApiCall";
import { useBackNavigation } from "../../hooks/useBackNavigation";
import { auditService } from "../../api/services/audit";
import { formatDateWithSeconds } from "../../utils/formatUtils";
import type {
  InstanceAuditResponse,
  AuditTask,
  AuditTaskExecution,
} from "../../api/schemas/audit";

const MONO = "'JetBrains Mono', monospace";

function safeDate(val: string | null | undefined) {
  return val ? formatDateWithSeconds(val) : "—";
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function formatDuration(durationMs: number | null): string {
  if (!durationMs || durationMs < 0) return "—";

  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      display="flex"
      alignItems="flex-start"
      gap={2}
      py={0.75}
      sx={{ borderBottom: "1px solid", borderColor: "divider" }}
    >
      <Typography
        sx={{
          fontSize: 12,
          color: "text.secondary",
          minWidth: 140,
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
      <Box flex={1}>{value}</Box>
    </Box>
  );
}

function JsonAccordion({ title, data }: { title: string; data: unknown }) {
  if (
    !data ||
    (typeof data === "object" && Object.keys(data as object).length === 0)
  )
    return null;
  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px !important",
        mt: 1.5,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
        sx={{ minHeight: 40 }}
      >
        <Typography fontSize={13} fontWeight={600}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Box
          component="pre"
          sx={{
            fontFamily: MONO,
            fontSize: 12,
            m: 0,
            p: 1.5,
            borderRadius: 1,
            backgroundColor: "action.hover",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

function TaskExecutionRow({ exec }: { exec: AuditTaskExecution }) {
  const inputVariables = toRecord(exec.inputVariables);
  const outputVariables = toRecord(exec.outputVariables);

  return (
    <Box
      sx={{
        py: 1.5,
        px: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Box display="flex" alignItems="center" gap={2} mb={0.5}>
        <StatusChip status={exec.status} />
        <Typography
          fontSize={12}
          color="text.secondary"
          sx={{ fontFamily: MONO }}
        >
          Started: {safeDate(exec.startedOn)}
          {exec.endedOn ? ` · Ended: ${safeDate(exec.endedOn)}` : ""}
        </Typography>
      </Box>
      {exec.message && (
        <Typography
          fontSize={13}
          sx={{ mt: 0.5, fontStyle: "italic", color: "text.secondary" }}
        >
          {exec.message}
        </Typography>
      )}
      {exec.error && (
        <Typography
          fontSize={12}
          sx={{ mt: 0.5, color: "error.main", fontWeight: 600 }}
        >
          Error: {exec.error}
        </Typography>
      )}
      {inputVariables && Object.keys(inputVariables).length > 0 && (
        <JsonAccordion title="Input Variables" data={inputVariables} />
      )}
      {outputVariables && Object.keys(outputVariables).length > 0 && (
        <JsonAccordion title="Output Variables" data={outputVariables} />
      )}
    </Box>
  );
}

function TaskRow({ task, index }: { task: AuditTask; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow
        sx={{ cursor: "pointer", "& td": { fontSize: 13, py: 1.25 } }}
        onClick={() => setOpen((o) => !o)}
        hover
      >
        <TableCell sx={{ width: 40 }}>
          <IconButton size="small">
            {open ? (
              <KeyboardArrowUpIcon fontSize="small" />
            ) : (
              <KeyboardArrowDownIcon fontSize="small" />
            )}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography
            sx={{ fontFamily: MONO, fontSize: 12, color: "text.secondary" }}
          >
            {index + 1}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography fontSize={13} fontWeight={500}>
            {task.nodeName ?? task.nodeId}
          </Typography>
          <Typography
            fontSize={11}
            color="text.secondary"
            sx={{ fontFamily: MONO }}
          >
            {task.taskType} · {task.nodeId}
          </Typography>
          {task.message && (
            <Typography
              fontSize={12}
              sx={{ mt: 0.5, fontStyle: "italic", color: "text.secondary" }}
            >
              {task.message}
            </Typography>
          )}
          {task.error && (
            <Typography
              fontSize={11}
              sx={{ mt: 0.5, color: "error.main", fontWeight: 600 }}
            >
              Error: {task.error}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <StatusChip status={task.currentStatus} />
        </TableCell>
        <TableCell>
          <Typography fontSize={12} color="text.secondary">
            {safeDate(task.createdOn)}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Chip
            label={`${task.taskExecutionLog.length} execution${task.taskExecutionLog.length !== 1 ? "s" : ""}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: 11, height: 22 }}
          />
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ bgcolor: "action.selected" }}>
              {task.taskExecutionLog.length === 0 ? (
                <Typography
                  fontSize={12}
                  color="text.disabled"
                  sx={{ px: 3, py: 2 }}
                >
                  No execution records for this task.
                </Typography>
              ) : (
                task.taskExecutionLog.map((exec) => (
                  <TaskExecutionRow key={exec.id} exec={exec} />
                ))
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function InstanceAuditPage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const { goBack } = useBackNavigation("/audit");
  const { loading, call } = useApiCall();
  const [audit, setAudit] = useState<InstanceAuditResponse | null>(null);
  const [search, setSearch] = useState("");

  const fetchAudit = useCallback(async () => {
    if (!instanceId) return;
    const data = await call(() => auditService.getInstanceAudit(instanceId), {
      showError: true,
    });
    if (data) setAudit(data as InstanceAuditResponse);
  }, [call, instanceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAudit();
  }, [fetchAudit]);

  const inst = audit?.instance;

  const filteredTasks =
    audit?.taskLog.filter((t) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        (t.nodeName ?? "").toLowerCase().includes(q) ||
        t.taskType.toLowerCase().includes(q) ||
        t.currentStatus.toLowerCase().includes(q) ||
        (t.nodeId ?? "").toLowerCase().includes(q)
      );
    }) ?? [];

  return (
    <Box>
      <PageHeader
        title={
          inst
            ? `Audit - ${inst.workflowName} v${inst.versionNumber}`
            : "Instance Audit"
        }
        subtitle={inst ? `Instance: ${inst.id}` : undefined}
        onBack={goBack}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tasks…"
        action={
          <Tooltip title="Reload">
            <IconButton
              size="small"
              onClick={fetchAudit}
              disabled={loading}
              sx={{ color: "text.secondary" }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      />

      {loading && !audit && (
        <Box display="flex" flexDirection="column" gap={2}>
          <Skeleton variant="rounded" height={220} />
          <Skeleton variant="rounded" height={300} />
        </Box>
      )}

      {!loading && !audit && (
        <Paper sx={{ py: 8, textAlign: "center" }}>
          <Typography color="text.secondary" fontSize={13}>
            Instance not found or audit unavailable.
          </Typography>
        </Paper>
      )}

      {audit && inst && (
        <Box display="flex" flexDirection="column" gap={2}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Typography fontWeight={700} fontSize={15}>
                Instance Details
              </Typography>
              <StatusChip status={inst.currentStatus} />
            </Box>

            <Box
              sx={{
                "& > *:not(:last-child)": {
                  borderBottom: "1px solid",
                  borderColor: "divider",
                },
              }}
            >
              <InfoRow
                label="Instance ID"
                value={
                  <Typography sx={{ fontFamily: MONO, fontSize: 12 }}>
                    {inst.id}
                  </Typography>
                }
              />
              <InfoRow
                label="Workflow"
                value={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontSize={13}>{inst.workflowName}</Typography>
                    <Typography
                      sx={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: "text.secondary",
                      }}
                    >
                      v{inst.versionNumber}
                    </Typography>
                  </Box>
                }
              />
              <InfoRow
                label="Auto Advance"
                value={
                  <Typography sx={{ fontFamily: MONO, fontSize: 12 }}>
                    {inst.autoAdvance ? "Yes" : "No"}
                  </Typography>
                }
              />

              {/* Instance Metadata Section */}
              <InfoRow
                label="Total Tasks"
                value={
                  <Box display="flex" gap={1}>
                    <Chip
                      label={`${inst.totalTasks} total`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: 11 }}
                    />
                    {inst.totalTasks > 0 && (
                      <Box display="flex" gap={0.5}>
                        {inst.taskStatusBreakdown.completed > 0 && (
                          <Chip
                            label={`${inst.taskStatusBreakdown.completed} completed`}
                            size="small"
                            sx={{ height: 22, fontSize: 10 }}
                            color="success"
                          />
                        )}
                        {inst.taskStatusBreakdown.failed > 0 && (
                          <Chip
                            label={`${inst.taskStatusBreakdown.failed} failed`}
                            size="small"
                            sx={{ height: 22, fontSize: 10 }}
                            color="error"
                          />
                        )}
                        {inst.taskStatusBreakdown.in_progress > 0 && (
                          <Chip
                            label={`${inst.taskStatusBreakdown.in_progress} in progress`}
                            size="small"
                            sx={{ height: 22, fontSize: 10 }}
                            color="warning"
                          />
                        )}
                        {inst.taskStatusBreakdown.terminated > 0 && (
                          <Chip
                            label={`${inst.taskStatusBreakdown.terminated} terminated`}
                            size="small"
                            sx={{ height: 22, fontSize: 10 }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                }
              />
              <InfoRow
                label="Total Executions"
                value={
                  <Typography sx={{ fontFamily: MONO, fontSize: 12 }}>
                    {inst.totalExecutions}
                  </Typography>
                }
              />
              {inst.durationMs !== null && (
                <InfoRow
                  label="Duration"
                  value={
                    <Typography sx={{ fontFamily: MONO, fontSize: 12 }}>
                      {formatDuration(inst.durationMs)}
                    </Typography>
                  }
                />
              )}

              <InfoRow
                label="Started"
                value={
                  <Typography fontSize={13}>
                    {safeDate(inst.startedAt)}
                  </Typography>
                }
              />
              {inst.completedAt && (
                <InfoRow
                  label="Completed"
                  value={
                    <Typography fontSize={13}>
                      {safeDate(inst.completedAt)}
                    </Typography>
                  }
                />
              )}
              {inst.failedAt && (
                <InfoRow
                  label="Failed"
                  value={
                    <Typography fontSize={13}>
                      {safeDate(inst.failedAt)}
                    </Typography>
                  }
                />
              )}
              {inst.terminatedAt && (
                <InfoRow
                  label="Terminated"
                  value={
                    <Typography fontSize={13}>
                      {safeDate(inst.terminatedAt)}
                    </Typography>
                  }
                />
              )}
            </Box>

            <JsonAccordion title="Input Variables" data={inst.inputVariables} />
            <JsonAccordion
              title="Output Variables"
              data={inst.outputVariables}
            />
          </Paper>

          {/* Task log table */}
          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography fontWeight={700} fontSize={15}>
                Task Log
              </Typography>
              <Chip
                label={`${audit.taskLog.length} task${audit.taskLog.length !== 1 ? "s" : ""}`}
                size="small"
                sx={{ ml: 1, height: 20, fontSize: 11 }}
              />
            </Box>

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
                  <TableCell sx={{ width: 40 }} />
                  <TableCell sx={{ width: 50 }}>#</TableCell>
                  <TableCell>Task</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Executions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ py: 6, textAlign: "center" }}>
                        <Typography fontSize={13} color="text.secondary">
                          {search
                            ? "No tasks match your search."
                            : "No tasks recorded."}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                {filteredTasks.map((task, i) => (
                  <TaskRow key={task.id} task={task} index={i} />
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
