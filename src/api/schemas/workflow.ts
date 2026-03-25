import { z } from 'zod';
import { PaginatedResponseSchema } from './common';

export const WorkflowVersionStatusSchema = z.enum(['draft', 'valid', 'published', 'active']);

export const NodeConfigSchema = z.record(z.string(), z.any());

export const NodeSchema = z.object({
  id: z.string().uuid(),
  nodeId: z.string(),
  type: z.enum(['start', 'user_task', 'service_task', 'script_task', 'exclusive_gateway', 'end']),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  config: NodeConfigSchema,
});

export const EdgeSchema = z.object({
  id: z.string().uuid(),
  edgeId: z.string(),
  source: z.string(),
  target: z.string(),
  sourcePort: z.string(),
  condition: z.string(),
  isDefault: z.boolean(),
});

export const WorkflowInputSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  required: z.boolean(),
});

export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  latestVersion: z.number().nullable().optional(),
  status: z.string().optional(),
  versions: z.array(z.object({
    versionNumber: z.number(),
    status: WorkflowVersionStatusSchema,
    publishedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
  })).optional(),
});

export const WorkflowVersionSchema = z.object({
  id: z.string().uuid(),
  workflowId: z.string().uuid(),
  versionNumber: z.number(),
  status: WorkflowVersionStatusSchema,
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  modifiedAt: z.string().datetime(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  inputs: z.array(WorkflowInputSchema),
});

export const CreateWorkflowRequestSchema = z.object({
  name: z.string().max(255),
  description: z.string().optional(),
});

export const UpdateWorkflowRequestSchema = z.object({
  name: z.string().max(255).optional(),
  description: z.string().optional(),
});

export const WorkflowResponseSchema = z.object({
  workflow: WorkflowSchema,
});

export const WorkflowsResponseSchema = PaginatedResponseSchema(WorkflowSchema);

export const CreateVersionRequestSchema = z.object({
  description: z.string().optional(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  inputs: z.array(WorkflowInputSchema).optional(),
});

export const UpdateVersionRequestSchema = z.object({
  nodes: z.array(NodeSchema).optional(),
  edges: z.array(EdgeSchema).optional(),
  inputs: z.array(WorkflowInputSchema).optional(),
});

export const VersionResponseSchema = z.object({
  version: WorkflowVersionSchema,
});

export const UpdateVersionStatusRequestSchema = z.object({
  status: WorkflowVersionStatusSchema,
});

export const ValidationErrorSchema = z.object({
  message: z.string(),
  nodeId: z.string().optional(),
  edgeId: z.string().optional(),
});

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(ValidationErrorSchema),
});

export type WorkflowVersionStatus = z.infer<typeof WorkflowVersionStatusSchema>;
export type NodeConfig = z.infer<typeof NodeConfigSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type WorkflowInput = z.infer<typeof WorkflowInputSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowVersion = z.infer<typeof WorkflowVersionSchema>;
export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>;
export type UpdateWorkflowRequest = z.infer<typeof UpdateWorkflowRequestSchema>;
export type WorkflowResponse = z.infer<typeof WorkflowResponseSchema>;
export type WorkflowsResponse = z.infer<typeof WorkflowsResponseSchema>;
export type CreateVersionRequest = z.infer<typeof CreateVersionRequestSchema>;
export type UpdateVersionRequest = z.infer<typeof UpdateVersionRequestSchema>;
export type VersionResponse = z.infer<typeof VersionResponseSchema>;
export type UpdateVersionStatusRequest = z.infer<typeof UpdateVersionStatusRequestSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;