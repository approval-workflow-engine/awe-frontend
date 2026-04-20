import { z } from "zod";
import { dateTransform, optionalDateTransform } from "./common";
import { PaginationSchema, EnvironmentTypeSchema } from "./common";

const VersionValueSchema = z.union([z.string(), z.number()]).nullable();

export const InstanceStatusSchema = z.enum([
  "in_progress",
  "completed",
  "failed",
  "paused",
  "terminated",
]);

export const CurrentTaskSchema = z.object({
  id: z.string().nullable().optional(),
  nodeId: z.string().nullable().optional(),
  taskExecutionId: z.string().nullable().optional(),
  userTaskExecutionId: z.string().nullable().optional(),
  latestTaskExecution: z.string().nullable().optional(),
  latestUserTaskExecution: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  startedAt: optionalDateTransform.optional(),
});

export const InstanceSchema = z.object({
  id: z.string(),
  inputVariables: z.unknown().nullable(),
  currentVariables: z.unknown().nullable(),
  outputVariables: z.unknown().nullable(),
  status: InstanceStatusSchema,
  startedAt: optionalDateTransform,
  endedAt: optionalDateTransform,
  autoAdvance: z.boolean(),
  workflow: z.object({
    name: z.string().nullable().optional(),
    id: z.string().nullable().optional(),
    version: VersionValueSchema,
  }),
  currentTask: CurrentTaskSchema.nullable().optional(),
});

export const InstanceListItemSchema = z.object({
  id: z.string(),
  environment: EnvironmentTypeSchema,
  auto_advance: z.boolean(),
  created_by: z.string(),
  created_on: dateTransform,
  current_node_id: z.string().nullable(),
  current_variables: z.unknown().nullable(),
  ended_on: optionalDateTransform,
  input_variables: z.unknown().nullable(),
  is_deleted: z.boolean(),
  output_variables: z.unknown().nullable(),
  started_on: optionalDateTransform,
  status: InstanceStatusSchema,
  workflow_version_id: z.string(),
  version_number: VersionValueSchema,
  workflow_name: z.string(),
});

export const CreateInstanceRequestSchema = z.object({
  workflowId: z.string(),
  context: z.record(z.string(), z.any()).optional(),
  autoAdvance: z.boolean().default(true),
});

export const CreateInstanceResponseSchema = z.object({
  id: z.string(),
  inputVariables: z.unknown().nullable(),
  status: InstanceStatusSchema,
  startedAt: dateTransform,
  autoAdvance: z.boolean(),
  environment: EnvironmentTypeSchema,
  workflow: z.object({
    id: z.string(),
    version: VersionValueSchema,
  }),
});

export const InstanceResponseSchema = InstanceSchema;

export const InstancesResponseSchema = z.object({
  instances: z.array(InstanceListItemSchema),
  pagination: PaginationSchema.optional(),
});



export const InstanceActionResponseSchema = z.object({
  instance: z.unknown(),
});

export const RetryConstantsResponseSchema = z.object({
  constants: z.record(z.string(), z.unknown()),
});

export const RetryInstanceRequestSchema = z.object({
  constants: z.record(z.string(), z.unknown()).default({}),
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

const TaskExecutionDetailItemSchema = z.object({
  inputVariables: z.unknown().nullable().optional(),
  outputVariables: z.unknown().nullable().optional(),
});

const TaskDetailItemSchema = z.object({
  id: z.string(),
  status: z.string(),
  createdAt: optionalDateTransform.optional().default(null),
  nodeId: z.string().nullable().optional(),
});

export const TaskExecutionDetailResponseSchema = z.object({
  task: TaskDetailItemSchema.nullable().optional(),
  taskExecution: TaskExecutionDetailItemSchema.nullable().optional(),
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
export type RetryConstantsResponse = z.infer<
  typeof RetryConstantsResponseSchema
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