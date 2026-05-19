import { apiClient } from "../client";
import {
  WorkflowsResponseSchema,
  WorkflowResponseSchema,
  WorkflowSchema,
  UpdateWorkflowResponseSchema,
  CreateWorkflowRequestSchema,
  UpdateWorkflowRequestSchema,
  WorkflowDraftsResponseSchema,
  WorkflowDraftDetailResponseSchema,
  WorkflowDraftCreateResponseSchema,
  WorkflowDraftUpdateResponseSchema,
  WorkflowDraftCloneResponseSchema,
  WorkflowVersionsResponseSchema,
  WorkflowVersionDetailResponseSchema,
  WorkflowVersionPromoteResponseSchema,
  CreateDraftRequestSchema,
  UpdateDraftRequestSchema,
  PublishDraftRequestSchema,
  ActivateVersionRequestSchema,
  DeactivateVersionRequestSchema,
  ValidationResultSchema,
  WorkflowPaginationParamsSchema,
  WorkflowDraftPaginationParamsSchema,
  WorkflowVersionPaginationParamsSchema,
  type WorkflowDraftsResponse,
  type WorkflowDraftDetailResponse,
  type WorkflowDraftCreateResponse,
  type WorkflowDraftUpdateResponse,
  type WorkflowDraftCloneResponse,
  type WorkflowVersionsResponse,
  type WorkflowVersionDetailResponse,
  type WorkflowVersionPromoteResponse,
  type WorkflowsResponse,
  type WorkflowResponse,
  type Workflow,
  type CreateWorkflowRequest,
  type UpdateWorkflowRequest,
  type WorkflowUpdateResponse,
  type CreateDraftRequest,
  type UpdateDraftRequest,
  type ValidationResult,
  type WorkflowPaginationParams,
  type WorkflowDraftPaginationParams,
  type WorkflowVersionPaginationParams,
} from "../schemas";
import { z } from "zod";

export class WorkflowService {
  async getWorkflows(params?: WorkflowPaginationParams): Promise<WorkflowsResponse> {
    const validatedParams = params
      ? WorkflowPaginationParamsSchema.parse(params)
      : undefined;
    return apiClient.get("/workflows", WorkflowsResponseSchema, {
      params: validatedParams,
    });
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return apiClient.get(`/workflows/${id}`, WorkflowSchema);
  }

  async createWorkflow(data: CreateWorkflowRequest): Promise<WorkflowResponse> {
    return apiClient.post(
      "/workflows",
      data,
      WorkflowResponseSchema,
      CreateWorkflowRequestSchema,
    );
  }

  async updateWorkflow(
    id: string,
    data: UpdateWorkflowRequest,
  ): Promise<WorkflowUpdateResponse> {
    return apiClient.patch(
      `/workflows/${id}`,
      data,
      UpdateWorkflowResponseSchema,
      UpdateWorkflowRequestSchema,
    );
  }

  async deleteWorkflow(id: string): Promise<Record<string, never>> {
    return apiClient.delete(`/workflows/${id}`, z.object({}));
  }

  async validateWorkflow(definition: unknown): Promise<ValidationResult> {
    return apiClient.post(
      "/workflows/validate",
      definition,
      ValidationResultSchema,
    );
  }

  // --- Drafts ---

  async createDraft(
    data: CreateDraftRequest,
  ): Promise<WorkflowDraftCreateResponse> {
    return apiClient.post(
      `/workflow-drafts`,
      data,
      WorkflowDraftCreateResponseSchema,
      CreateDraftRequestSchema,
    );
  }

  async getDraft(id: string, includeDefinition = true): Promise<WorkflowDraftDetailResponse> {
    const params = includeDefinition ? { include: "definition" } : undefined;
    return apiClient.get(
      `/workflow-drafts/${id}`,
      WorkflowDraftDetailResponseSchema,
      { params },
    );
  }

  async getDrafts(
    params?: WorkflowDraftPaginationParams,
  ): Promise<WorkflowDraftsResponse> {
    const validatedParams = params
      ? WorkflowDraftPaginationParamsSchema.parse(params)
      : undefined;
    return apiClient.get(`/workflow-drafts`, WorkflowDraftsResponseSchema, {
      params: validatedParams,
    });
  }

  async updateDraft(
    id: string,
    data: UpdateDraftRequest,
  ): Promise<WorkflowDraftUpdateResponse> {
    return apiClient.patch(
      `/workflow-drafts/${id}`,
      data,
      WorkflowDraftUpdateResponseSchema,
      UpdateDraftRequestSchema,
    );
  }

  async validateDraft(id: string): Promise<ValidationResult> {
    return apiClient.post(
      `/workflow-drafts/${id}/validate`,
      {},
      ValidationResultSchema,
    );
  }

  async publishDraft(
    id: string,
    incrementType: "major" | "minor" | "patch",
  ): Promise<WorkflowVersionDetailResponse> {
    return apiClient.post(
      `/workflow-drafts/${id}/publish`,
      { incrementType },
      WorkflowVersionDetailResponseSchema,
      PublishDraftRequestSchema,
    );
  }

  async deleteDraft(id: string): Promise<Record<string, never>> {
    return apiClient.delete(`/workflow-drafts/${id}`, z.object({}));
  }

  async cloneDraft(id: string): Promise<WorkflowDraftCloneResponse> {
    return apiClient.post(
      `/workflow-drafts/${id}/clone`,
      {},
      WorkflowDraftCloneResponseSchema,
    );
  }

  // --- Versions ---

  async getVersions(
    params?: WorkflowVersionPaginationParams,
  ): Promise<WorkflowVersionsResponse> {
    const validatedParams = params
      ? WorkflowVersionPaginationParamsSchema.parse(params)
      : undefined;
    return apiClient.get(`/workflow-versions`, WorkflowVersionsResponseSchema, {
      params: validatedParams,
    });
  }

  async getVersion(id: string, includeDefinition = true, environment?: string): Promise<WorkflowVersionDetailResponse> {
    const params: Record<string, string> = {};
    if (includeDefinition) params.include = "definition";
    if (environment) params.environment = environment;

    return apiClient.get(
      `/workflow-versions/${id}`,
      WorkflowVersionDetailResponseSchema,
      { params },
    );
  }

  async activateVersion(
    id: string,
    environment: "development" | "staging" | "production",
  ): Promise<WorkflowVersionDetailResponse> {
    return apiClient.post(
      `/workflow-versions/${id}/activate`,
      { environment },
      WorkflowVersionDetailResponseSchema,
      ActivateVersionRequestSchema,
    );
  }

  async deactivateVersion(
    id: string,
    environment: "development" | "staging" | "production",
  ): Promise<WorkflowVersionDetailResponse> {
    return apiClient.post(
      `/workflow-versions/${id}/deactivate`,
      { environment },
      WorkflowVersionDetailResponseSchema,
      DeactivateVersionRequestSchema,
    );
  }

  async cloneVersion(id: string): Promise<WorkflowDraftCloneResponse> {
    return apiClient.post(
      `/workflow-versions/${id}/clone`,
      {},
      WorkflowDraftCloneResponseSchema,
    );
  }

  async promoteVersion(
    id: string,
  ): Promise<WorkflowVersionPromoteResponse> {
    return apiClient.post(
      `/workflow-versions/${id}/promote`,
      {},
      WorkflowVersionPromoteResponseSchema,
      undefined,
    );
  }
}

export const workflowService = new WorkflowService();
