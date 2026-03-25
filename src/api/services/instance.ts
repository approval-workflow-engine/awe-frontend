import { apiClient } from '../client';
import {
  InstancesResponseSchema,
  InstanceResponseSchema,
  CreateInstanceRequestSchema,
  AdvanceInstanceResponseSchema,
  ExecutionLogsResponseSchema,
  PaginationParamsSchema,
  type InstancesResponse,
  type InstanceResponse,
  type CreateInstanceRequest,
  type AdvanceInstanceResponse,
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

  async createInstance(data: CreateInstanceRequest): Promise<InstanceResponse> {
    return apiClient.post(
      '/instances',
      data,
      InstanceResponseSchema,
      CreateInstanceRequestSchema
    );
  }

  async advanceInstance(id: string): Promise<AdvanceInstanceResponse> {
    return apiClient.post(`/instances/${id}/advance`, {}, AdvanceInstanceResponseSchema);
  }

  async getExecutionLogs(id: string): Promise<ExecutionLogsResponse> {
    return apiClient.get(`/instances/${id}/executions`, ExecutionLogsResponseSchema);
  }
}

export const instanceService = new InstanceService();