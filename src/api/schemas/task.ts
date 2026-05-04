import { z } from 'zod';
import {
  dateTransform,
  optionalDateTransform,
  PaginationParamsSchema,
  PaginationSchema,
} from './common';

export const TaskStatusSchema = z.enum(['in_progress', 'completed', 'rejected', 'failed', 'terminated']);

export const UserTaskDisplayFieldSchema = z.object({
  label: z.string(),
  value: z.any(),
});

export const UserTaskResponseFieldOptionSchema = z.object({
  label: z.string().optional(),
  valueExpression: z.string().optional(),
  value: z.string().optional(),
});

export const UserTaskResponseFieldSchema = z.object({
  fieldId: z.string(),
  label: z.string(),
  type: z.string().optional(),
  dataType: z.string().optional(),
  required: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  uiType: z.enum(['text', 'textarea', 'number', 'dropdown', 'checkbox', 'date-picker']).optional(),
  options: z.array(UserTaskResponseFieldOptionSchema).optional(),
  contextVariable: z.object({
    name: z.string(),
    scope: z.literal('global'),
  }).optional(),
});

export const UserTaskNodeConfigurationSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  assignee: z.string().optional(),
  requestMap: z.array(UserTaskDisplayFieldSchema),
  responseMap: z.array(UserTaskResponseFieldSchema),
});

export const PendingUserTaskSchema = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  assignee: z.string().nullable().optional(),
  createdAt: dateTransform,
  instanceId: z.string(),
  taskId: z.string(),
  workflowVersionId: z.string(),
  nodeId: z.string(),
});

export const TaskDetailNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  configuration: z.unknown().nullable().optional(),
});

export const TaskDetailExecutionSchema = z.object({
  id: z.string(),
  status: z.string(),
  startedAt: optionalDateTransform.optional().default(null),
  endedAt: optionalDateTransform.optional().default(null),
  inputVariables: z.unknown().nullable().optional(),
  outputVariables: z.record(z.string(), z.unknown()).nullable().optional(),
  title: z.string().nullable().optional(),
  assignee: z.string().nullable().optional(),
});

export const TaskDetailSchema = z.object({
  id: z.string(),
  instanceId: z.string(),
  status: z.string(),
  createdAt: optionalDateTransform.optional().default(null),
  node: TaskDetailNodeSchema,
  executions: z.array(TaskDetailExecutionSchema).optional().default([]),
});

export const UserTaskDetailSchema = z.object({
  id: z.string(),
  title: z.string().nullable().optional(),
  assignee: z.string().nullable().optional(),
  startedAt: optionalDateTransform.optional().default(null),
  endedAt: optionalDateTransform.optional().default(null),
  status: z.string(),
  requestData: z.record(z.string(), z.any()).optional().default({}),
  responseData: z.array(UserTaskResponseFieldSchema).optional().default([]),
  instanceId: z.string(),
  taskId: z.string(),
  workflowVersionId: z.string(),
  nodeId: z.string(),
});

export const PendingTasksResponseSchema = z.object({
  userTasks: z.array(PendingUserTaskSchema),
  pagination: PaginationSchema,
});

export const PendingTasksQueryParamsSchema = PaginationParamsSchema.extend({
  assignee: z.string().optional(),
});

export const TaskDetailResponseSchema = UserTaskDetailSchema;

export const CompleteTaskRequestSchema = z.record(z.string(), z.any());

export const CompleteTaskResponseSchema = UserTaskDetailSchema;

export const RetryTaskResponseSchema = TaskDetailSchema;

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type UserTaskDisplayField = z.infer<typeof UserTaskDisplayFieldSchema>;
export type UserTaskResponseFieldOption = z.infer<typeof UserTaskResponseFieldOptionSchema>;
export type UserTaskResponseField = z.infer<typeof UserTaskResponseFieldSchema>;
export type UserTaskNodeConfiguration = z.infer<typeof UserTaskNodeConfigurationSchema>;
export type PendingUserTask = z.infer<typeof PendingUserTaskSchema>;
export type TaskDetail = z.infer<typeof TaskDetailSchema>;
export type UserTaskDetail = z.infer<typeof UserTaskDetailSchema>;
export type PendingTasksResponse = z.infer<typeof PendingTasksResponseSchema>;
export type PendingTasksQueryParams = z.infer<typeof PendingTasksQueryParamsSchema>;
export type TaskDetailResponse = z.infer<typeof TaskDetailResponseSchema>;
export type CompleteTaskRequest = z.infer<typeof CompleteTaskRequestSchema>;
export type CompleteTaskResponse = z.infer<typeof CompleteTaskResponseSchema>;
export type RetryTaskResponse = z.infer<typeof RetryTaskResponseSchema>;

