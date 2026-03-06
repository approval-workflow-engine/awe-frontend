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

export const advanceInstance = (id: string, data?: { context?: Record<string, unknown> }) =>
  axiosClient.post(`/instances/${id}/advance`, data || {});

export const terminateInstance = (id: string) =>
  axiosClient.patch(`/instances/${id}/terminate`);

export const pauseInstance = (id: string) =>
  axiosClient.patch(`/instances/${id}/pause`);

export const resumeInstance = (id: string) =>
  axiosClient.patch(`/instances/${id}/resume`);

export const retryInstance = (id: string, data: { mode: string }) =>
  axiosClient.patch(`/instances/${id}/retry`, data);

export const getInstanceHistory = (id: string) =>
  axiosClient.get(`/instances/${id}/history`);

export const getInstanceTasks = (id: string) =>
  axiosClient.get(`/instances/${id}/tasks`);
