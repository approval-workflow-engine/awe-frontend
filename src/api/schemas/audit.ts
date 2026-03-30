import { z } from 'zod';
import { dateTransform, optionalDateTransform } from './common';

export const AuditTaskExecutionSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  status: z.string(),
  startedOn: optionalDateTransform,
  endedOn: optionalDateTransform,
  createdOn: dateTransform,
  inputVariables: z.record(z.string(), z.any()).nullable().optional(),
  outputVariables: z.record(z.string(), z.any()).nullable().optional(),
  message: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});

export const AuditTaskSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  nodeName: z.string().nullable(),
  taskType: z.string(),
  currentStatus: z.string(),
  createdOn: dateTransform,
  message: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
  taskExecutionLog: z.array(AuditTaskExecutionSchema),
});

export const AuditInstanceSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  workflowName: z.string(),
  versionNumber: z.number(),
  workflowVersionId: z.string(),
  currentStatus: z.string(),
  startedAt: optionalDateTransform,
  completedAt: optionalDateTransform,
  failedAt: optionalDateTransform,
  terminatedAt: optionalDateTransform,
  autoAdvance: z.boolean(),
  inputVariables: z.record(z.string(), z.any()).nullable().optional(),
  outputVariables: z.record(z.string(), z.any()).nullable().optional(),
  currentVariables: z.record(z.string(), z.any()).nullable().optional(),
  createdBy: z.string(),
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
