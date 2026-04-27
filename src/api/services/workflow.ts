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
  WorkflowVersionPromoteResponseSchema,
  WorkflowVersionCloneResponseSchema,
  UpdateVersionStatusRequestSchema,
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
  type WorkflowVersionPromoteResponse,
  type WorkflowVersionCloneResponse,
  type VersionIncrementType,
  type CreateVersionRequest,
  type UpdateVersionRequest,
  type ValidationResult,
  type PaginationParams,
} from "../schemas";
import { z } from "zod";

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
    incrementType?: VersionIncrementType,
  ): Promise<WorkflowVersionStatusResponse> {
    const endpoint =
      status === "active"
        ? `/workflows/versions/${versionId}/activate`
        : `/workflows/versions/${versionId}/publish`;

    const payload = UpdateVersionStatusRequestSchema.parse({ incrementType });

    return apiClient.post(
      endpoint,
      payload,
      WorkflowVersionStatusResponseSchema,
    );
  }

  async deactivateWorkflowVersion(
    versionId: string,
  ): Promise<WorkflowVersionStatusResponse> {
    return apiClient.post(
      `/workflows/versions/${versionId}/deactivate`,
      {},
      WorkflowVersionStatusResponseSchema,
    );
  }

  async promoteWorkflowVersion(
    versionId: string,
  ): Promise<WorkflowVersionPromoteResponse> {
    return apiClient.post(
      `/workflows/versions/${versionId}/promote`,
      {},
      WorkflowVersionPromoteResponseSchema,
      undefined,
    );
  }
}

export const workflowService = new WorkflowService();
