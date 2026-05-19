import { z } from "zod";
import { PaginationSchema, EnvironmentTypeSchema, ActorTypeSchema } from "./common";

export const WorkflowVersionStatusSchema = z.enum([
  "draft",
  "valid",
  "published",
  "active",
]);

export const VersionIncrementTypeSchema = z.enum([
  "major",
  "minor",
  "patch",
]);

export const NodeConfigSchema = z.record(z.string(), z.any());

export const NodeSchema = z.object({
  id: z.string(),
  type: z.enum(["start", "user", "service", "script", "email", "decision", "end"]),
  label: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  configuration: NodeConfigSchema,
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .nullable()
    .optional(),
});

export const EdgeSchema = z.object({
  id: z.string(),
  label: z.string().nullable().optional(),
  sourceNodeId: z.string(),
  targetNodeId: z.string().nullable().optional(),
  ruleId: z
    .union([z.string(), z.literal("default")])
    .nullable()
    .optional(),
});

export const WorkflowInputSchema = z.object({
  name: z.string(),
  type: z.enum([
    "string",
    "number",
    "boolean",
    "object",
    "list",
    "date",
    "time",
    "date-time",
    "null",
  ]),
  required: z.boolean(),
});

export const WorkflowDefinitionSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

export const ValidationErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
  nodeId: z.string().optional(),
  edgeId: z.string().optional(),
});

export const WorkflowDraftDetailResponseSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  description: z.string().nullable().optional(),
  status: z.enum(["draft", "valid"]),
  version: z.null().optional(),
  environment: EnvironmentTypeSchema.optional(),
  startVariables: z.array(z.any()).optional(),
  createdAt: z.string().datetime().optional(),
  createdBy: ActorTypeSchema.optional(),
  modifiedAt: z.string().datetime(),
  modifiedBy: ActorTypeSchema,
  valid: z.boolean().optional(),
  errors: z.array(ValidationErrorSchema).optional(),
  definition: WorkflowDefinitionSchema.optional(),
});

export const WorkflowVersionDetailResponseSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  description: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  status: z.enum(["published", "active"]),
  environment: EnvironmentTypeSchema.optional(),
  startVariables: z.array(z.any()).optional(),
  createdAt: z.string().datetime().optional(),
  createdBy: ActorTypeSchema.optional(),
  modifiedAt: z.string().datetime(),
  modifiedBy: ActorTypeSchema,
  definition: WorkflowDefinitionSchema.optional(),
});

export const WorkflowDraftCreateResponseSchema = WorkflowDraftDetailResponseSchema;
export const WorkflowDraftUpdateResponseSchema = WorkflowDraftDetailResponseSchema;

export const WorkflowVersionPromoteResponseSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  description: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  status: z.enum(["published", "active"]),
  createdAt: z.string().datetime().optional(),
  createdBy: ActorTypeSchema.optional(),
  modifiedAt: z.string().datetime(),
  modifiedBy: ActorTypeSchema,
  environment: EnvironmentTypeSchema.optional(),
  startVariables: z.array(z.any()).optional(),
});

export const WorkflowDraftCloneResponseSchema = WorkflowDraftDetailResponseSchema;

// Shared single-workflow response shape (GET /workflows/:id, POST /workflows, PATCH /workflows/:id)
export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  createdBy: ActorTypeSchema.optional(),
  modifiedAt: z.string().datetime({ message: "Invalid ISO datetime" }),
  modifiedBy: ActorTypeSchema,
});

export const WorkflowVersionSchema = WorkflowVersionDetailResponseSchema;

export const CreateWorkflowRequestSchema = z.object({
  name: z.string().max(255),
  description: z.string().nullable().optional(),
});

export const UpdateWorkflowRequestSchema = z.object({
  name: z.string().max(255).optional(),
  description: z.string().nullable().optional(),
});

// Single workflow response — same shape for GET, POST, PATCH
export const UpdateWorkflowResponseSchema = WorkflowSchema;
export const WorkflowResponseSchema = WorkflowSchema;

export const WorkflowListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  activeVersionCount: z.number().optional(),
  draftCount: z.number().optional(),
  modifiedAt: z.string().datetime({ message: "Invalid ISO datetime" }),
  modifiedBy: ActorTypeSchema,
});

export const WorkflowsResponseSchema = z.object({
  workflows: z.array(WorkflowListItemSchema),
  pagination: PaginationSchema,
});

export const WorkflowPaginationParamsSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  search: z.string().optional(),
  createdSort: z.enum(["asc", "desc"]).optional(),
  environment: EnvironmentTypeSchema.optional(),
});

export const WorkflowDraftListItemSchema = z.object({
  id: z.string(),
  version: z.null().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["draft", "valid"]),
  modifiedAt: z.string().datetime(),
  modifiedBy: ActorTypeSchema,
});

export const WorkflowDraftsResponseSchema = z.object({
  drafts: z.array(WorkflowDraftListItemSchema),
  pagination: PaginationSchema,
});

export const WorkflowDraftPaginationParamsSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  workflowId: z.string().optional(),
});

export const WorkflowVersionListItemSchema = z.object({
  id: z.string(),
  version: z.string(),
  description: z.string().nullable().optional(),
  status: z.enum(["published", "active"]),
  modifiedAt: z.string().datetime(),
  modifiedBy: ActorTypeSchema,
});

export const WorkflowVersionsResponseSchema = z.object({
  versions: z.array(WorkflowVersionListItemSchema),
  pagination: PaginationSchema,
});

export const WorkflowVersionPaginationParamsSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  workflowId: z.string().optional(),
  environment: EnvironmentTypeSchema.optional(),
});

export const CreateDraftRequestSchema = z.object({
  workflowId: z.string(),
  description: z.string().nullable().optional(),
  definition: WorkflowDefinitionSchema,
});

export const UpdateDraftRequestSchema = z.object({
  description: z.string().nullable().optional(),
  definition: WorkflowDefinitionSchema.optional(),
});

export const PublishDraftRequestSchema = z.object({
  incrementType: VersionIncrementTypeSchema,
});

export const ActivateVersionRequestSchema = z.object({
  environment: EnvironmentTypeSchema,
});

export const DeactivateVersionRequestSchema = z.object({
  environment: EnvironmentTypeSchema,
});

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(ValidationErrorSchema),
  warnings: z.array(ValidationErrorSchema).optional().default([]),
});

export type WorkflowVersionStatus = z.infer<typeof WorkflowVersionStatusSchema>;
export type NodeConfig = z.infer<typeof NodeConfigSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type WorkflowInput = z.infer<typeof WorkflowInputSchema>;
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>;
export type UpdateWorkflowRequest = z.infer<typeof UpdateWorkflowRequestSchema>;
export type WorkflowResponse = z.infer<typeof WorkflowResponseSchema>;
export type WorkflowUpdateResponse = z.infer<typeof UpdateWorkflowResponseSchema>;
export type WorkflowsResponse = z.infer<typeof WorkflowsResponseSchema>;
export type WorkflowPaginationParams = z.infer<typeof WorkflowPaginationParamsSchema>;
export type WorkflowListItem = z.infer<typeof WorkflowListItemSchema>;

export type WorkflowDraftListItem = z.infer<typeof WorkflowDraftListItemSchema>;
export type WorkflowDraftsResponse = z.infer<typeof WorkflowDraftsResponseSchema>;
export type WorkflowDraftPaginationParams = z.infer<typeof WorkflowDraftPaginationParamsSchema>;
export type WorkflowVersionListItem = z.infer<typeof WorkflowVersionListItemSchema>;
export type WorkflowVersionsResponse = z.infer<typeof WorkflowVersionsResponseSchema>;
export type WorkflowVersionPaginationParams = z.infer<typeof WorkflowVersionPaginationParamsSchema>;

export type CreateDraftRequest = z.infer<typeof CreateDraftRequestSchema>;
export type UpdateDraftRequest = z.infer<typeof UpdateDraftRequestSchema>;
export type PublishDraftRequest = z.infer<typeof PublishDraftRequestSchema>;
export type ActivateVersionRequest = z.infer<typeof ActivateVersionRequestSchema>;
export type DeactivateVersionRequest = z.infer<typeof DeactivateVersionRequestSchema>;

export type WorkflowDraftDetailResponse = z.infer<typeof WorkflowDraftDetailResponseSchema>;
export type WorkflowVersionDetailResponse = z.infer<typeof WorkflowVersionDetailResponseSchema>;
export type WorkflowDraftCreateResponse = z.infer<typeof WorkflowDraftCreateResponseSchema>;
export type WorkflowDraftUpdateResponse = z.infer<typeof WorkflowDraftUpdateResponseSchema>;
export type WorkflowVersionPromoteResponse = z.infer<typeof WorkflowVersionPromoteResponseSchema>;
export type WorkflowDraftCloneResponse = z.infer<typeof WorkflowDraftCloneResponseSchema>;

export type VersionIncrementType = z.infer<typeof VersionIncrementTypeSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
