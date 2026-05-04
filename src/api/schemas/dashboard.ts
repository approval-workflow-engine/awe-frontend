import { z } from "zod";



export const DashboardStatsSchema = z.object({
  totalWorkflows: z.number(),
  totalInstances: z.number(),
  totalRunningInstances: z.number(),
  totalPendingUserTasks: z.number(),
});

export const DashboardResponseSchema = DashboardStatsSchema;

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;