import { z } from 'zod';
import { PaginationSchema } from './common';

export const WorkflowVersionStatusSchema = z.enum(['draft', 'valid', 'published', 'active']);

export const NodeConfigSchema = z.record(z.string(), z.any());

export const NodeSchema = z.object({
  id: z.string(),
  type: z.enum(['start', 'user', 'service', 'script', 'decision', 'end']),
  label: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  configuration: NodeConfigSchema,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).nullable().optional(),
});

export const EdgeSchema = z.object({
  id: z.string(),
  label: z.string().nullable().optional(),
  sourceNodeId: z.string(),
  targetNodeId: z.string().nullable().optional(),
  ruleId: z.union([z.string(), z.literal('default')]).nullable().optional(),
});

export const WorkflowInputSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  required: z.boolean(),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  environmentType: z.enum(['production', 'development', 'staging']).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  latestVersion: z.number().nullable().optional(),
  status: z.string().optional(),
  versions: z.array(z.object({
    id: z.string(),
    version: z.number(),
    status: WorkflowVersionStatusSchema,
    description: z.string().nullable().optional(),
    publishedAt: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })).optional(),
});

export const WorkflowVersionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  version: z.number(),
  status: WorkflowVersionStatusSchema,
  description: z.string().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  environmentType: z.enum(['production', 'development', 'staging']).optional(),
  createdAt: z.string().datetime(),
  modifiedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  nodes: z.array(NodeSchema).optional(),
  edges: z.array(EdgeSchema).optional(),
  startVariables: z.array(WorkflowInputSchema).optional(),
  inputs: z.array(WorkflowInputSchema).optional(),
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

export const WorkflowsResponseSchema = z.object({
  workflows: z.array(WorkflowSchema),
  pagination: PaginationSchema,
});

export const WorkflowVersionListItemSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  versionNumber: z.number(),
  status: WorkflowVersionStatusSchema,
  description: z.string().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  environmentType: z.enum(['production', 'development', 'staging']).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const WorkflowVersionsResponseSchema = z.object({
  versions: z.array(WorkflowVersionListItemSchema),
  pagination: PaginationSchema,
});

export const CreateVersionRequestSchema = z.object({
  description: z.string().optional(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  inputs: z.array(WorkflowInputSchema).optional(),
});

export const UpdateVersionRequestSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  inputs: z.array(WorkflowInputSchema).optional(),
  description: z.string().nullable().optional(),
});

export const VersionResponseSchema = z.union([
  WorkflowVersionSchema,
  z.object({ version: WorkflowVersionSchema }),
]);

export const UpdateVersionStatusRequestSchema = z.object({
  status: WorkflowVersionStatusSchema,
});

export const ValidationErrorSchema = z.object({
  code: z.number(),
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
export type WorkflowVersionListItem = z.infer<typeof WorkflowVersionListItemSchema>;
export type WorkflowVersionsResponse = z.infer<typeof WorkflowVersionsResponseSchema>;
export type CreateVersionRequest = z.infer<typeof CreateVersionRequestSchema>;
export type UpdateVersionRequest = z.infer<typeof UpdateVersionRequestSchema>;
export type VersionResponse = z.infer<typeof VersionResponseSchema>;
export type UpdateVersionStatusRequest = z.infer<typeof UpdateVersionStatusRequestSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;