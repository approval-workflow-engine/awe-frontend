import { apiClient } from './client';
import {
  CreateInstanceRequestSchema,
  CreateInstanceResponseSchema,
  InstanceResponseSchema,
  InstancesResponseSchema,
  ExecutionLogsResponseSchema,
  AdvanceInstanceResponseSchema
} from './schemas/instance';
import type { PaginationParams } from '../types';

export const createInstance = (data: {
  workflowId: string;
  context?: Record<string, unknown>;
  autoAdvance?: boolean;
}) => apiClient.post('/instances', data, CreateInstanceResponseSchema, CreateInstanceRequestSchema);

export const getInstances = (params?: PaginationParams) =>
  apiClient.get('/instances', InstancesResponseSchema, { params });

export const getInstance = (id: string) =>
  apiClient.get(`/instances/${id}`, InstanceResponseSchema);

export const getInstanceExecutions = (id: string) =>
  apiClient.get(`/instances/${id}/executions`, ExecutionLogsResponseSchema);

export const resumeInstance = (id: string) =>
  apiClient.post(`/instances/${id}/advance`, {}, AdvanceInstanceResponseSchema);
