import { apiClient } from '../client';
import {
  WorkflowsResponseSchema,
  WorkflowResponseSchema,
  WorkflowSchema,
  CreateWorkflowRequestSchema,
  UpdateWorkflowRequestSchema,
  WorkflowVersionsResponseSchema,
  VersionResponseSchema,
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
  type VersionResponse,
  type CreateVersionRequest,
  type UpdateVersionRequest,
  type ValidationResult,
  type PaginationParams,
} from '../schemas';
import { z } from 'zod';

export class WorkflowService {
  async getWorkflows(params?: PaginationParams): Promise<WorkflowsResponse> {
    const validatedParams = params ? PaginationParamsSchema.parse(params) : undefined;
    return apiClient.get('/workflows', WorkflowsResponseSchema, {
      params: validatedParams,
    });
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return apiClient.get(`/workflows/${id}`, WorkflowSchema);
  }

  async createWorkflow(data: CreateWorkflowRequest): Promise<WorkflowResponse> {
    return apiClient.post(
      '/workflows',
      data,
      WorkflowResponseSchema,
      CreateWorkflowRequestSchema
    );
  }

  async updateWorkflow(
    id: string,
    data: UpdateWorkflowRequest
  ): Promise<Workflow> {
    return apiClient.patch(
      `/workflows/${id}`,
      data,
      WorkflowSchema,
      UpdateWorkflowRequestSchema
    );
  }

  async deleteWorkflow(id: string): Promise<Record<string, never>> {
    return apiClient.delete(`/workflows/${id}`, z.object({}));
  }

  async validateWorkflow(definition: any): Promise<ValidationResult> {
    return apiClient.post('/workflows/validate', definition, ValidationResultSchema);
  }

  async createVersion(
    workflowId: string,
    data: CreateVersionRequest
  ): Promise<VersionResponse> {
    return apiClient.post(
      `/workflows/${workflowId}/versions`,
      data,
      VersionResponseSchema,
      CreateVersionRequestSchema
    );
  }

  async getVersion(versionId: string): Promise<VersionResponse> {
    return apiClient.get(
      `/workflows/versions/${versionId}`,
      VersionResponseSchema
    );
  }

  async updateVersion(
    versionId: string,
    data: UpdateVersionRequest
  ): Promise<VersionResponse> {
    return apiClient.patch(
      `/workflows/versions/${versionId}`,
      data,
      VersionResponseSchema,
      UpdateVersionRequestSchema
    );
  }

  async validateVersion(versionId: string): Promise<ValidationResult> {
    return apiClient.post(
      `/workflows/versions/${versionId}/validate`,
      {},
      ValidationResultSchema
    );
  }

  async getWorkflowVersions(
    workflowId: string,
    params?: PaginationParams,
  ): Promise<WorkflowVersionsResponse> {
    const validatedParams = params ? PaginationParamsSchema.parse(params) : undefined;
    return apiClient.get(`/workflows/${workflowId}/versions`, WorkflowVersionsResponseSchema, {
      params: validatedParams,
    });
  }

  async updateVersionStatus(
    versionId: string,
    status: 'published' | 'active'
  ): Promise<VersionResponse> {
    const endpoint =
      status === 'active'
        ? `/workflows/versions/${versionId}/activate`
        : `/workflows/versions/${versionId}/publish`;

    return apiClient.post(endpoint, {}, VersionResponseSchema);
  }
}

export const workflowService = new WorkflowService();