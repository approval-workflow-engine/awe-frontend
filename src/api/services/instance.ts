import { apiClient } from '../client';
import {
  InstancesResponseSchema,
  InstanceResponseSchema,
  CreateInstanceResponseSchema,
  CreateInstanceRequestSchema,
  InstanceActionResponseSchema,
  ExecutionLogsResponseSchema,
  PaginationParamsSchema,
  type InstancesResponse,
  type InstanceResponse,
  type CreateInstanceResponse,
  type CreateInstanceRequest,
  type InstanceActionResponse,
  type ExecutionLogsResponse,
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

  async retryInstance(id: string): Promise<InstanceActionResponse> {
    return apiClient.post(`/instances/${id}/retry`, {}, InstanceActionResponseSchema);
  }

  async getExecutionLogs(id: string): Promise<ExecutionLogsResponse> {
    return apiClient.get(`/instances/${id}/executions`, ExecutionLogsResponseSchema);
  }
}

export const instanceService = new InstanceService();