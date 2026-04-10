import { apiClient } from "../client";
import {
  WorkflowsResponseSchema,
  WorkflowResponseSchema,
  WorkflowSchema,
  UpdateWorkflowResponseSchema,
  CreateWorkflowRequestSchema,
  UpdateWorkflowRequestSchema,
  WorkflowVersionsResponseSchema,
  WorkflowVersionDetailResponseSchema,
  WorkflowVersionCreateResponseSchema,
  WorkflowVersionUpdateResponseSchema,
  WorkflowVersionStatusResponseSchema,
  WorkflowVersionCloneResponseSchema,
  CreateVersionRequestSchema,
  UpdateVersionRequestSchema,
  ValidationResultSchema,
  PaginationParamsSchema,
  type WorkflowVersionsResponse,
  type WorkflowsResponse,
  type WorkflowResponse,
  type Workflow,
  type CreateWorkflowRequest,
  type UpdateWorkflowRequest,
  type WorkflowUpdateResponse,
  type WorkflowVersionDetailResponse,
  type WorkflowVersionCreateResponse,
  type WorkflowVersionUpdateResponse,
  type WorkflowVersionStatusResponse,
  type WorkflowVersionCloneResponse,
  type CreateVersionRequest,
  type UpdateVersionRequest,
  type ValidationResult,
  type PaginationParams,
} from "../schemas";
import { z } from "zod";
import type { EnvironmentType } from "../../constants/environment";

export class WorkflowService {
  async getWorkflows(params?: PaginationParams): Promise<WorkflowsResponse> {
    const validatedParams = params
      ? PaginationParamsSchema.parse(params)
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

  async createVersion(
    workflowId: string,
    data: CreateVersionRequest,
  ): Promise<WorkflowVersionCreateResponse> {
    return apiClient.post(
      `/workflows/${workflowId}/versions`,
      data,
      WorkflowVersionCreateResponseSchema,
      CreateVersionRequestSchema,
    );
  }

  async getVersion(versionId: string): Promise<WorkflowVersionDetailResponse> {
    return apiClient.get(
      `/workflows/versions/${versionId}`,
      WorkflowVersionDetailResponseSchema,
    );
  }

  async updateVersion(
    versionId: string,
    data: UpdateVersionRequest,
  ): Promise<WorkflowVersionUpdateResponse> {
    return apiClient.patch(
      `/workflows/versions/${versionId}`,
      data,
      WorkflowVersionUpdateResponseSchema,
      UpdateVersionRequestSchema,
    );
  }

  async validateVersion(versionId: string): Promise<ValidationResult> {
    return apiClient.post(
      `/workflows/versions/${versionId}/validate`,
      {},
      ValidationResultSchema,
    );
  }

  async cloneWorkflowVersion(versionId: string): Promise<WorkflowVersionCloneResponse> {
    return apiClient.post(
      `/workflows/versions/${versionId}/clone`,
      {},
      WorkflowVersionCloneResponseSchema,
    );
  }

  async getWorkflowVersions(
    workflowId: string,
    params?: PaginationParams,
  ): Promise<WorkflowVersionsResponse> {
    const validatedParams = params
      ? PaginationParamsSchema.parse(params)
      : undefined;
    return apiClient.get(
      `/workflows/${workflowId}/versions`,
      WorkflowVersionsResponseSchema,
      {
        params: validatedParams,
      },
    );
  }

  async updateVersionStatus(
    versionId: string,
    status: "published" | "active",
  ): Promise<WorkflowVersionStatusResponse> {
    const endpoint =
      status === "active"
        ? `/workflows/versions/${versionId}/activate`
        : `/workflows/versions/${versionId}/publish`;

    return apiClient.post(endpoint, {}, WorkflowVersionStatusResponseSchema);
  }

  async promoteWorkflowVersion(
    versionId: string,
    targetEnvironmentType: EnvironmentType,
  ): Promise<unknown> {
    return apiClient.post(
      `/workflows/versions/${versionId}/promote`,
      { environmentType: targetEnvironmentType },
      z.unknown(),
      undefined,
    );
  }
}

export const workflowService = new WorkflowService();
