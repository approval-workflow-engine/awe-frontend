import { apiClient } from '../client';
import {
  InstancesResponseSchema,
  InstanceResponseSchema,
  CreateInstanceResponseSchema,
  CreateInstanceRequestSchema,
  InstanceActionResponseSchema,
  ExecutionSequenceResponseSchema,
  TaskExecutionDetailResponseSchema,
  RetryConstantsResponseSchema,
  RetryInstanceRequestSchema,
  PaginationParamsSchema,
  type InstancesResponse,
  type InstanceResponse,
  type CreateInstanceResponse,
  type CreateInstanceRequest,
  type InstanceActionResponse,
  type ExecutionSequenceResponse,
  type TaskExecutionDetailResponse,
  type RetryConstantsResponse,
  type RetryInstanceRequest,
  type PaginationParams,
} from '../schemas';

export class InstanceService {
  async getInstances(params?: PaginationParams): Promise<InstancesResponse> {
    const validatedParams = params ? PaginationParamsSchema.parse(params) : undefined;
    return apiClient.get('/instances', InstancesResponseSchema, {
      params: validatedParams,
    });
  }

  async getInstance(id: string): Promise<InstanceResponse> {
    return apiClient.get(`/instances/${id}`, InstanceResponseSchema);
  }

  async createInstance(data: CreateInstanceRequest): Promise<CreateInstanceResponse> {
    return apiClient.post(
      '/instances',
      data,
      CreateInstanceResponseSchema,
      CreateInstanceRequestSchema
    );
  }

  async resumeInstance(id: string): Promise<InstanceActionResponse> {
    return apiClient.post(`/instances/${id}/resume`, {}, InstanceActionResponseSchema);
  }

  async pauseInstance(id: string): Promise<InstanceActionResponse> {
    return apiClient.post(`/instances/${id}/pause`, {}, InstanceActionResponseSchema);
  }

  async terminateInstance(id: string): Promise<InstanceActionResponse> {
    return apiClient.post(`/instances/${id}/terminate`, {}, InstanceActionResponseSchema);
  }

  async getRetryConstants(id: string): Promise<RetryConstantsResponse> {
    return apiClient.get(`/instances/${id}/constants`, RetryConstantsResponseSchema);
  }

  async retryInstance(
    id: string,
    data: RetryInstanceRequest = { constants: {} },
  ): Promise<InstanceActionResponse> {
    return apiClient.post(
      `/instances/${id}/retry`,
      data,
      InstanceActionResponseSchema,
      RetryInstanceRequestSchema,
    );
  }

  async getExecutionSequence(id: string): Promise<ExecutionSequenceResponse> {
    return apiClient.get(
      `/instances/${id}/execution-sequence`,
      ExecutionSequenceResponseSchema,
    );
  }

  async getTaskDetail(id: string, taskId: string): Promise<TaskExecutionDetailResponse> {
    return apiClient.get(
      `/instances/${id}/tasks/${taskId}`,
      TaskExecutionDetailResponseSchema,
    );
  }
}

export const instanceService = new InstanceService();