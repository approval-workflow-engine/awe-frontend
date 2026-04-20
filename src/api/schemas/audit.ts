import { z } from 'zod';
import { dateTransform, optionalDateTransform } from './common';

export const AuditTaskExecutionSchema = z.object({
  id: z.string(),
  taskId: z.string().nullable().optional(),
  status: z.string(),
  startedOn: optionalDateTransform,
  endedOn: optionalDateTransform,
  createdOn: optionalDateTransform,
  inputVariables: z.unknown().nullable().optional(),
  outputVariables: z.unknown().nullable().optional(),
  message: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});

export const AuditTaskSchema = z.object({
  id: z.string(),
  nodeId: z.string().nullable().optional(),
  nodeName: z.string().nullable(),
  taskType: z.string(),
  currentStatus: z.string(),
  createdOn: optionalDateTransform,
  message: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
  taskExecutionLog: z.array(AuditTaskExecutionSchema).default([]),
});

export const AuditInstanceSchema = z.object({
  id: z.string(),
  workflowId: z.string().nullable().optional(),
  workflowName: z.string().nullable().optional(),
  versionNumber: z.union([z.string(), z.number()]).nullable(),
  workflowVersionId: z.string().nullable().optional(),
  currentStatus: z.string(),
  startedAt: optionalDateTransform,
  completedAt: optionalDateTransform,
  failedAt: optionalDateTransform,
  terminatedAt: optionalDateTransform,
  autoAdvance: z.boolean(),
  inputVariables: z.unknown().nullable().optional(),
  outputVariables: z.unknown().nullable().optional(),
  currentVariables: z.unknown().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  createdOn: dateTransform,
  totalTasks: z.number(),
  taskStatusBreakdown: z.object({
    completed: z.number(),
    failed: z.number(),
    in_progress: z.number(),
    terminated: z.number(),
  }),
  totalExecutions: z.number(),
  durationMs: z.number().nullable(),
});

export const InstanceAuditResponseSchema = z.object({
  instance: AuditInstanceSchema,
  taskLog: z.array(AuditTaskSchema),
});

export type AuditTaskExecution = z.infer<typeof AuditTaskExecutionSchema>;
export type AuditTask = z.infer<typeof AuditTaskSchema>;
export type AuditInstance = z.infer<typeof AuditInstanceSchema>;
export type InstanceAuditResponse = z.infer<typeof InstanceAuditResponseSchema>;
