import { z } from "zod";
import { optionalDateTransform } from "./common";
import { PaginationSchema, EnvironmentTypeSchema } from "./common";



const VersionValueSchema = z.union([z.string(), z.number()]).nullable();

export const InstanceStatusSchema = z.enum([
  "in_progress",
  "completed",
  "failed",
  "paused",
  "terminated",
]);

export const ContextSchema = z.object({
  constants: z.record(z.string(), z.unknown()).default({}),
  fetchables: z.record(z.string(), z.any()).default({}),
  urls: z.record(z.string(), z.any()).default({}),
  secrets: z.record(z.string(), z.string()).default({}),
});

export const CurrentTaskSchema = z.object({
  id: z.string(),
  status: z.string(),
  startedAt: optionalDateTransform,
  executionId: z.string().nullable(),
  nodeId: z.string(),
  name: z.string().nullable(),
  type: z.string(),
});

export const InstanceSchema = z.object({
  id: z.string(),
  inputVariables: z.record(z.string(), z.unknown()).nullable(),
  currentVariables: ContextSchema.nullable(),
  outputVariables: z.record(z.string(), z.unknown()).nullable(),
  status: InstanceStatusSchema,
  startedAt: optionalDateTransform,
  endedAt: optionalDateTransform,
  autoAdvance: z.boolean(),
  controlSignal: z.string().nullable().optional(),
  workflow: z.object({
    id: z.string(),
    name: z.string(),
    versionId: z.string().optional(),
    version: VersionValueSchema,
  }),
  currentTask: CurrentTaskSchema.nullable().optional(),
});

export const InstanceListItemSchema = z.object({
  id: z.string(),
  status: InstanceStatusSchema,
  controlSignal: z.string().nullable().optional(),
  autoAdvance: z.boolean(),
  startedAt: optionalDateTransform,
  endedAt: optionalDateTransform,
  workflow: z.object({
    id: z.string(),
    name: z.string(),
    versionId: z.string(),
    version: VersionValueSchema,
  }),
  environment: EnvironmentTypeSchema,
  createdBy: z.string(),
});

export const CreateInstanceRequestSchema = z.object({
  workflowId: z.string(),
  context: z.record(z.string(), z.any()).optional(),
  autoAdvance: z.boolean().default(true),
});

export const CreateInstanceResponseSchema = InstanceSchema;

export const InstanceResponseSchema = InstanceSchema;

export const InstancesResponseSchema = z.object({
  instances: z.array(InstanceListItemSchema),
  pagination: PaginationSchema.optional(),
});

export const InstanceActionResponseSchema = InstanceSchema;

export const RetryInstanceRequestSchema = z.object({
  taskId: z.string(),
  context: z.record(z.string(), z.unknown()).default({}),
});


export const ExecutionConnectionSchema = z.object({
  destinationNodeClientId: z.string().nullable().optional().default(null),
  conditionExpression: z.string().nullable().optional().default(null),
});

export const ExecutionNodeSchema = z.object({
  taskId: z.string().nullable().optional().default(null),
  taskExecutionId: z.string().nullable().optional().default(null),
  userTaskExecutionId: z.string().nullable().optional(),
  nodeName: z.string().nullable().optional().default(null),
  nodeType: z.string(),
  nodeClientId: z.string(),
  status: z.enum([
    "completed",
    "failed",
    "in_progress",
    "terminated",
    "pending",
    "discarded",
  ]),
  startTime: optionalDateTransform.optional().default(null),
  endTime: optionalDateTransform.optional().default(null),
  order: z.number().optional().default(0),
  outgoingConnections: z.array(ExecutionConnectionSchema).optional().default([]),
});

export const ExecutionLogSchema = ExecutionNodeSchema;

export const ExecutionSequenceResponseSchema = z.object({
  executionSequence: z.array(ExecutionNodeSchema),
});

const TaskDetailExecutionSchema = z.object({
  id: z.string(),
  status: z.string(),
  startedAt: optionalDateTransform.optional().default(null),
  endedAt: optionalDateTransform.optional().default(null),
  inputVariables: z.unknown().nullable().optional(),
  outputVariables: z.unknown().nullable().optional(),
  title: z.string().nullable().optional(),
  assignee: z.string().nullable().optional(),
});

const TaskDetailNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  configuration: z.unknown().nullable().optional(),
});

export const TaskExecutionDetailResponseSchema = z.object({
  id: z.string(),
  instanceId: z.string().optional(),
  status: z.string(),
  createdAt: optionalDateTransform.optional().default(null),
  node: TaskDetailNodeSchema.nullable().optional(),
  executions: z.array(TaskDetailExecutionSchema).optional().default([]),
  task: z.unknown().nullable().optional(),
  taskExecution: z.unknown().nullable().optional(),
  nodeConfiguration: z.unknown().nullable().optional(),
});

export const ExecutionLogsResponseSchema = ExecutionSequenceResponseSchema;

export type InstanceStatus = z.infer<typeof InstanceStatusSchema>;
export type CurrentTask = z.infer<typeof CurrentTaskSchema>;
export type Instance = z.infer<typeof InstanceSchema>;
export type InstanceListItem = z.infer<typeof InstanceListItemSchema>;
export type CreateInstanceRequest = z.infer<typeof CreateInstanceRequestSchema>;
export type CreateInstanceResponse = z.infer<
  typeof CreateInstanceResponseSchema
>;
export type InstanceResponse = z.infer<typeof InstanceResponseSchema>;
export type InstancesResponse = z.infer<typeof InstancesResponseSchema>;

export type InstanceActionResponse = z.infer<
  typeof InstanceActionResponseSchema
>;
export type RetryInstanceRequest = z.infer<typeof RetryInstanceRequestSchema>;
export type ExecutionConnection = z.infer<typeof ExecutionConnectionSchema>;
export type ExecutionNode = z.infer<typeof ExecutionNodeSchema>;
export type ExecutionLog = z.infer<typeof ExecutionLogSchema>;
export type ExecutionSequenceResponse = z.infer<
  typeof ExecutionSequenceResponseSchema
>;
export type TaskExecutionDetailResponse = z.infer<
  typeof TaskExecutionDetailResponseSchema
>;
export type ExecutionLogsResponse = z.infer<typeof ExecutionLogsResponseSchema>;
