import { z } from "zod";
import { PendingUserTaskSchema } from "./task";
import { EnvironmentTypeSchema } from "./common";

const DashboardInstanceSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    created_on: z.union([z.string(), z.date()]).optional().nullable(),
    ended_on: z.union([z.string(), z.date()]).optional().nullable(),
    auto_advance: z.boolean().optional(),
    workflow_name: z.string().optional().nullable(),
    version_number: z.union([z.string(), z.number()]).optional().nullable(),
    workflow_version_id: z.string().optional().nullable(),
    startedAt: z.union([z.string(), z.date()]).optional().nullable(),
    endedAt: z.union([z.string(), z.date()]).optional().nullable(),
    autoAdvance: z.boolean().optional(),
    environment: EnvironmentTypeSchema.optional().nullable(),
    controlSignal: z.string().optional().nullable(),
    workflow: z
      .object({
        id: z.string().optional(),
        name: z.string().optional().nullable(),
        versionId: z.string().optional().nullable(),
        version: z.union([z.string(), z.number()]).optional().nullable(),
      })
      .optional()
      .nullable(),
    createdBy: z.string().optional().nullable(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    status: row.status,
    startedAt:
      row.startedAt != null
        ? typeof row.startedAt === "string"
          ? row.startedAt
          : (row.startedAt as Date).toISOString()
        : row.created_on != null
          ? typeof row.created_on === "string"
            ? row.created_on
            : (row.created_on as Date).toISOString()
          : null,
    endedAt:
      row.endedAt != null
        ? typeof row.endedAt === "string"
          ? row.endedAt
          : (row.endedAt as Date).toISOString()
        : row.ended_on != null
          ? typeof row.ended_on === "string"
            ? row.ended_on
            : (row.ended_on as Date).toISOString()
          : null,
    autoAdvance: row.autoAdvance ?? row.auto_advance ?? true,
    environment: row.environment ?? null,
    controlSignal: row.controlSignal ?? null,
    workflow: row.workflow ?? {
      id: undefined,
      name: row.workflow_name ?? null,
      versionId: row.workflow_version_id ?? null,
      version: row.version_number ?? null,
    },
    createdBy: row.createdBy ?? null,
  }));

export type DashboardInstance = z.infer<typeof DashboardInstanceSchema>;

export const DashboardStatsSchema = z.object({
  workflows: z.number(),
  instances: z.number(),
  running: z.number(),
  pending: z.number(),
});

export const DashboardResponseSchema = z.object({
  stats: DashboardStatsSchema,
  instances: z.array(DashboardInstanceSchema),
  tasks: z.array(PendingUserTaskSchema),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;