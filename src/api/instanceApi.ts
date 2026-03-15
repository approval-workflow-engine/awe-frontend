import axiosClient from './axiosClient';
import type { PaginationParams } from '../types';

export const createInstance = (data: {
  workflowId: string;
  context?: Record<string, unknown>;
  autoAdvance?: boolean;
}) => axiosClient.post('/instances', data);

export const getInstances = (params?: PaginationParams) =>
  axiosClient.get('/instances', { params });

export const getInstance = (id: string) =>
  axiosClient.get(`/instances/${id}`);

export const resumeInstance = (id: string) =>
  axiosClient.post(`/instances/${id}/advance`);
