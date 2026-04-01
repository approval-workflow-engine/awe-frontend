import { z } from 'zod';
import { dateTransform, optionalDateTransform, PaginationSchema } from './common';

export const InstanceStatusSchema = z.enum(['in_progress', 'completed', 'failed', 'paused', 'terminated']);

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
  workflow: z.object({
    id: z.string(),
    version: z.number(),
  }),
});

export const InstanceResponseSchema = InstanceSchema;

export const InstancesResponseSchema = z.object({
  instances: z.array(InstanceListItemSchema),
  pagination: PaginationSchema,
});

export const AdvanceInstanceResponseSchema = z.object({});

export const ExecutionLogSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  status: z.string(),
  input_variables: z.record(z.string(), z.any()).nullable(),
  output_variables: z.record(z.string(), z.any()).nullable(),
  started_on: optionalDateTransform,
  ended_on: optionalDateTransform,
  created_on: dateTransform,
  node_id: z.string(),
  node_client_id: z.string(),
  node_type: z.string(),
  node_name: z.string().nullable(),
  node_configuration: z.any(),
});

export const ExecutionNodeConnectionSchema = z.object({
  destinationNodeId: z.string().nullable(),
  destinationNodeClientId: z.string().nullable(),
  conditionExpression: z.string().nullable(),
});

export const ExecutionNodeSchema = z.object({
  nodeId: z.string(),
  nodeClientId: z.string(),
  nodeType: z.string(),
  nodeName: z.string().nullable(),
  order: z.number(),
  status: z.enum(['completed', 'failed', 'pending', 'in_progress', 'terminated']),
  startedOn: optionalDateTransform,
  endedOn: optionalDateTransform,
  inputVariables: z.record(z.string(), z.any()).nullable(),
  outputVariables: z.record(z.string(), z.any()).nullable(),
  outgoingConnections: z.array(ExecutionNodeConnectionSchema),
});

export const ExecutionLogsResponseSchema = z.object({
  data: z.object({
    executions: z.array(ExecutionNodeSchema),
  }),
});

export type InstanceStatus = z.infer<typeof InstanceStatusSchema>;
export type CurrentTask = z.infer<typeof CurrentTaskSchema>;
export type Instance = z.infer<typeof InstanceSchema>;
export type InstanceListItem = z.infer<typeof InstanceListItemSchema>;
export type CreateInstanceRequest = z.infer<typeof CreateInstanceRequestSchema>;
export type CreateInstanceResponse = z.infer<typeof CreateInstanceResponseSchema>;
export type InstanceResponse = z.infer<typeof InstanceResponseSchema>;
export type InstancesResponse = z.infer<typeof InstancesResponseSchema>;
export type AdvanceInstanceResponse = z.infer<typeof AdvanceInstanceResponseSchema>;
export type ExecutionLog = z.infer<typeof ExecutionLogSchema>;
export type ExecutionNodeConnection = z.infer<typeof ExecutionNodeConnectionSchema>;
export type ExecutionNode = z.infer<typeof ExecutionNodeSchema>;
export type ExecutionLogsResponse = z.infer<typeof ExecutionLogsResponseSchema>;