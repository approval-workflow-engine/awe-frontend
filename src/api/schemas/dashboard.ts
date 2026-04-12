import { z } from "zod";
import { PendingUserTaskSchema } from "./task";
import { InstanceListItemSchema } from "./instance";

export const DashboardStatsSchema = z.object({
  workflows: z.number(),
  instances: z.number(),
  running: z.number(),
  pending: z.number(),
});

export const DashboardResponseSchema = z.object({
  stats: DashboardStatsSchema,
  instances: z.array(InstanceListItemSchema),
  tasks: z.array(PendingUserTaskSchema),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;