import { useEffect, useState, type ElementType } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Paper, Typography, Button, Skeleton } from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import SpeedIcon from "@mui/icons-material/Speed";
import AssignmentIcon from "@mui/icons-material/Assignment";
import StatusChip from "../../components/common/StatusChip";
import PageHeader from "../../components/common/PageHeader";
import type { BackendInstance, BackendTask } from "../../types";
import { workflowService } from "../../api/services/workflow";
import { instanceService } from "../../api/services/instance";
import { taskService } from "../../api/services/task";

interface StatCardDef {
  key: string;
  label: string;
  icon: ElementType;
  color: string;
}

const STAT_CARDS: StatCardDef[] = [
  {
    key: "workflows",
    label: "Total Workflows",
    icon: AccountTreeIcon,
    color: "#4f6ef7",
  },
  {
    key: "instances",
    label: "Total Instances",
    icon: PlayCircleIcon,
    color: "#a855f7",
  },
  { key: "running", label: "Running Now", icon: SpeedIcon, color: "#06b6d4" },
  {
    key: "pending",
    label: "Pending Tasks",
    icon: AssignmentIcon,
    color: "#f59e0b",
  },
];

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface StatCardProps {
  card: StatCardDef;
  value: number | null;
}

function StatCard({ card, value }: StatCardProps) {
  const IconComp = card.icon;
  return (
    <Paper
      sx={{
        p: 2.5,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: card.color,
        },
      }}
    >
      <Box
        display="flex"
        alignItems="flex-start"
        justifyContent="space-between"
      >
        <Box>
          {value === null ? (
            <Skeleton variant="text" width={60} height={40} />
          ) : (
            <Typography
              sx={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 32,
                color: "text.primary",
                lineHeight: 1,
              }}
            >
              {value}
            </Typography>
          )}
          <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}>
            {card.label}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            backgroundColor: `${card.color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComp sx={{ fontSize: 20, color: card.color }} />
        </Box>
      </Box>
    </Paper>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<Record<string, number | null>>({
    workflows: null,
    instances: null,
    running: null,
    pending: null,
  });
  const [instances, setInstances] = useState<BackendInstance[] | null>(null);
  const [tasks, setTasks] = useState<BackendTask[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [wfRes, instRes, taskRes] = await Promise.allSettled([
          workflowService.getWorkflows({ page: 1, limit: 100 }),
          instanceService.getInstances({ page: 1, limit: 100 }),
          taskService.getPendingTasks({ page: 1, limit: 100 }),
        ]);

        if (cancelled) return;

        const wfData = (wfRes.status === "fulfilled" ? wfRes.value : {}) as {
          workflows?: unknown[];
          pagination?: { total?: number };
        };
        const instData = (
          instRes.status === "fulfilled" ? instRes.value : {}
        ) as {
          instances?: BackendInstance[];
          pagination?: { total?: number };
        };
        const taskData = (
          taskRes.status === "fulfilled" ? taskRes.value : {}
        ) as {
          tasks?: BackendTask[];
          pagination?: { total?: number };
        };

        const allWorkflows = (wfData.workflows as unknown[]) ?? [];
        const allInstances = (instData.instances as BackendInstance[]) ?? [];
        const allTasks = (taskData.tasks as BackendTask[]) ?? [];
        const workflowTotal = Number(
          (wfData.pagination as { total?: number } | undefined)?.total ??
            allWorkflows.length,
        );
        const instanceTotal = Number(
          (instData.pagination as { total?: number } | undefined)?.total ??
            allInstances.length,
        );
        const taskTotal = Number(
          (taskData.pagination as { total?: number } | undefined)?.total ??
            allTasks.length,
        );

        const runningCount = allInstances.filter(
          (inst) => inst.status === "in_progress",
        ).length;

        setStats({
          workflows: workflowTotal,
          instances: instanceTotal,
          running: runningCount,
          pending: taskTotal,
        });

        setInstances(allInstances.slice(0, 5));
        setTasks(allTasks.slice(0, 5));
      } catch {
        setStats({ workflows: 0, instances: 0, running: 0, pending: 0 });
        setInstances([]);
        setTasks([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your workflow system"
      />

      <Grid container spacing={2} mb={4}>
        {STAT_CARDS.map((card) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={card.key}>
            <StatCard card={card} value={stats[card.key]} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ overflow: "hidden" }}>
            <Box
              sx={{
                px: 2.5,
                py: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "text.primary",
                }}
              >
                Recent Instances
              </Typography>
              <Button
                size="small"
                onClick={() => navigate("/instances")}
                sx={{ color: "primary.main", fontSize: 12 }}
              >
                View All
              </Button>
            </Box>
            <Box>
              {instances === null ? (
                [0, 1, 2, 3, 4].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Skeleton variant="text" width={160} height={18} />
                      <Skeleton
                        variant="text"
                        width={80}
                        height={14}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <Skeleton
                      variant="rounded"
                      width={80}
                      height={20}
                      sx={{ borderRadius: "99px" }}
                    />
                  </Box>
                ))
              ) : instances.length === 0 ? (
                <Box sx={{ px: 2.5, py: 4, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                    No instances yet
                  </Typography>
                </Box>
              ) : (
                instances.map((inst) => (
                  <Box
                    key={inst.id}
                    onClick={() =>
                      navigate(`/instances/${inst.id}`, {
                        state: { instance: inst },
                      })
                    }
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "action.hover" },
                      "&:last-child": { borderBottom: 0 },
                    }}
                  >
                    <Box minWidth={0} flex={1} mr={1}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "text.primary",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {inst.workflow_name || "Unnamed"}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          color: "text.disabled",
                        }}
                      >
                        {formatDate(inst.started_on || inst.created_on)}
                      </Typography>
                    </Box>
                    <StatusChip status={inst.status} />
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ overflow: "hidden" }}>
            <Box
              sx={{
                px: 2.5,
                py: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "text.primary",
                }}
              >
                Pending Tasks
              </Typography>
              <Button
                size="small"
                onClick={() => navigate("/tasks")}
                sx={{ color: "primary.main", fontSize: 12 }}
              >
                View All
              </Button>
            </Box>
            <Box>
              {tasks === null ? (
                [0, 1, 2, 3, 4].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Skeleton variant="text" width={150} height={18} />
                      <Skeleton
                        variant="text"
                        width={120}
                        height={14}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <Skeleton variant="text" width={70} height={14} />
                  </Box>
                ))
              ) : tasks.length === 0 ? (
                <Box sx={{ px: 2.5, py: 4, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                    No pending tasks
                  </Typography>
                </Box>
              ) : (
                tasks.map((task) => (
                  <Box
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "action.hover" },
                      "&:last-child": { borderBottom: 0 },
                    }}
                  >
                    <Box minWidth={0} flex={1} mr={1}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "text.primary",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {task.node_configuration?.title ||
                          task.node_id ||
                          "Untitled Task"}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "text.secondary",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {task.node_configuration?.assignee || "-"}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: "text.disabled",
                        flexShrink: 0,
                      }}
                    >
                      {formatDate(task.created_on)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
