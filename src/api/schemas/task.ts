import { z } from 'zod';
import { dateTransform } from './common';

export const TaskStatusSchema = z.enum(['in_progress', 'completed', 'rejected']);

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
  id: z.string().uuid(),
  title: z.string().nullable(),
  assignee: z.string().nullable(),
  createdAt: dateTransform,
  workflow: z.object({
    instanceId: z.string().uuid(),
    id: z.string().uuid(),
    name: z.string(),
    version: z.number(),
  }),
});

export const TaskDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  assignee: z.string().nullable(),
  startedAt: dateTransform,
  status: TaskStatusSchema,
  requestData: z.record(z.string(), z.any()).optional(),
  responseData: z.array(z.object({
    fieldId: z.string(),
    label: z.string(),
    dataType: z.string(),
  })).optional(),
  workflow: z.any(), 
});

export const PendingTasksResponseSchema = z.object({
  tasks: z.array(PendingUserTaskSchema),
});

export const TaskDetailResponseSchema = TaskDetailSchema;

export const CompleteTaskRequestSchema = z.record(z.string(), z.any());

export const CompleteTaskResponseSchema = z.object({
  status: z.string(),
  completedAt: dateTransform,
});

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type UserTaskDisplayField = z.infer<typeof UserTaskDisplayFieldSchema>;
export type UserTaskResponseFieldOption = z.infer<typeof UserTaskResponseFieldOptionSchema>;
export type UserTaskResponseField = z.infer<typeof UserTaskResponseFieldSchema>;
export type UserTaskNodeConfiguration = z.infer<typeof UserTaskNodeConfigurationSchema>;
export type PendingUserTask = z.infer<typeof PendingUserTaskSchema>;
export type TaskDetail = z.infer<typeof TaskDetailSchema>;
export type PendingTasksResponse = z.infer<typeof PendingTasksResponseSchema>;
export type TaskDetailResponse = z.infer<typeof TaskDetailResponseSchema>;
export type CompleteTaskRequest = z.infer<typeof CompleteTaskRequestSchema>;
export type CompleteTaskResponse = z.infer<typeof CompleteTaskResponseSchema>;