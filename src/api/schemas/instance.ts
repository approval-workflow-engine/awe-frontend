import { z } from "zod";
import { dateTransform, optionalDateTransform } from "./common";
import { PaginationSchema, EnvironmentTypeSchema } from "./common";

export const InstanceStatusSchema = z.enum([
  "in_progress",
  "completed",
  "failed",
  "paused",
  "terminated",
]);

export const CurrentTaskSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  type: z.string(),
  name: z.string().nullable(),
  status: z.string(),
  startedAt: dateTransform,
});

export const InstanceSchema = z.object({
  id: z.string(),
  inputVariables: z.record(z.string(), z.any()).nullable(),
  currentVariables: z.record(z.string(), z.any()).nullable(),
  outputVariables: z.record(z.string(), z.any()).nullable(),
  status: InstanceStatusSchema,
  startedAt: optionalDateTransform,
  endedAt: optionalDateTransform,
  autoAdvance: z.boolean(),
  workflow: z.object({
    name: z.string(),
    id: z.string(),
    version: z.number(),
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
  current_variables: z.record(z.string(), z.any()).nullable(),
  ended_on: optionalDateTransform,
  input_variables: z.record(z.string(), z.any()).nullable(),
  is_deleted: z.boolean(),
  output_variables: z.record(z.string(), z.any()).nullable(),
  started_on: optionalDateTransform,
  status: InstanceStatusSchema,
  workflow_version_id: z.string(),
  version_number: z.number().nullable(),
  workflow_name: z.string(),
});

export const CreateInstanceRequestSchema = z.object({
  workflowId: z.string(),
  context: z.record(z.string(), z.any()).optional(),
  autoAdvance: z.boolean().default(true),
});

export const CreateInstanceResponseSchema = z.object({
  id: z.string(),
  inputVariables: z.record(z.string(), z.any()).nullable(),
  status: InstanceStatusSchema,
  startedAt: dateTransform,
  autoAdvance: z.boolean(),
  environment: EnvironmentTypeSchema,
  workflow: z.object({
    id: z.string(),
    version: z.number(),
  }),
});

export const InstanceResponseSchema = InstanceSchema;

export const InstancesResponseSchema = z.object({
  instances: z.array(InstanceListItemSchema),
  pagination: PaginationSchema.optional(),
});

export const AdvanceInstanceResponseSchema = z.object({});

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
  destinationNodeClientId: z.string().nullable(),
  conditionExpression: z.string().nullable(),
});

export const ExecutionNodeSchema = z.object({
  taskId: z.string().nullable(),
  taskExecutionId: z.string().nullable(),
  userTaskExecutionId: z.string().nullable().optional(),
  nodeName: z.string().nullable(),
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
  startTime: optionalDateTransform,
  endTime: optionalDateTransform,
  order: z.number(),
  outgoingConnections: z.array(ExecutionConnectionSchema),
});

export const ExecutionLogSchema = ExecutionNodeSchema;

export const ExecutionSequenceResponseSchema = z.object({
  executionSequence: z.array(ExecutionNodeSchema),
});

const TaskExecutionDetailItemSchema = z.object({
  inputVariables: z.unknown().nullable(),
  outputVariables: z.unknown().nullable(),
});

const TaskDetailItemSchema = z.object({
  id: z.string(),
  status: z.string(),
  createdAt: dateTransform,
  nodeId: z.string(),
});

export const TaskExecutionDetailResponseSchema = z.object({
  task: TaskDetailItemSchema,
  taskExecution: TaskExecutionDetailItemSchema,
  nodeConfiguration: z.any().nullable(),
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
export type AdvanceInstanceResponse = z.infer<
  typeof AdvanceInstanceResponseSchema
>;
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