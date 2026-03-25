import { apiClient } from '../client';
import {
  WorkflowsResponseSchema,
  WorkflowResponseSchema,
  CreateWorkflowRequestSchema,
  UpdateWorkflowRequestSchema,
  VersionResponseSchema,
  CreateVersionRequestSchema,
  UpdateVersionRequestSchema,
  UpdateVersionStatusRequestSchema,
  ValidationResultSchema,
  PaginationParamsSchema,
  type WorkflowsResponse,
  type WorkflowResponse,
  type CreateWorkflowRequest,
  type UpdateWorkflowRequest,
  type VersionResponse,
  type CreateVersionRequest,
  type UpdateVersionRequest,
  type UpdateVersionStatusRequest,
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

  async getWorkflow(id: string): Promise<WorkflowResponse> {
    return apiClient.get(`/workflows/${id}`, WorkflowResponseSchema);
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
  ): Promise<WorkflowResponse> {
    return apiClient.patch(
      `/workflows/${id}`,
      data,
      WorkflowResponseSchema,
      UpdateWorkflowRequestSchema
    );
  }

  async deleteWorkflow(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/workflows/${id}`, z.object({ success: z.boolean() }));
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

  async getVersion(workflowId: string, versionNumber: number): Promise<VersionResponse> {
    return apiClient.get(
      `/workflows/${workflowId}/versions/${versionNumber}`,
      VersionResponseSchema
    );
  }

  async updateVersion(
    workflowId: string,
    versionNumber: number,
    data: UpdateVersionRequest
  ): Promise<VersionResponse> {
    return apiClient.patch(
      `/workflows/${workflowId}/versions/${versionNumber}`,
      data,
      VersionResponseSchema,
      UpdateVersionRequestSchema
    );
  }

  async validateVersion(
    workflowId: string,
    versionNumber: number
  ): Promise<ValidationResult> {
    return apiClient.post(
      `/workflows/${workflowId}/versions/${versionNumber}/validate`,
      {},
      ValidationResultSchema
    );
  }

  async updateVersionStatus(
    workflowId: string,
    versionNumber: number,
    data: UpdateVersionStatusRequest
  ): Promise<VersionResponse> {
    return apiClient.patch(
      `/workflows/${workflowId}/versions/${versionNumber}/status`,
      data,
      VersionResponseSchema,
      UpdateVersionStatusRequestSchema
    );
  }
}

export const workflowService = new WorkflowService();