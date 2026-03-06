import axiosClient from './axiosClient';
import type { PaginationParams, WorkflowDefinition } from '../types';

export const getWorkflows = (params?: PaginationParams) =>
  axiosClient.get('/workflows', { params });

export const createWorkflow = (data: { name: string; description?: string }) =>
  axiosClient.post('/workflows', data);

export const getWorkflow = (id: string) =>
  axiosClient.get(`/workflows/${id}`);

export const updateWorkflow = (id: string, data: { name?: string; description?: string }) =>
  axiosClient.patch(`/workflows/${id}`, data);

export const deleteWorkflow = (id: string) =>
  axiosClient.delete(`/workflows/${id}`);

export const updateWorkflowStatus = (id: string, status: string) =>
  axiosClient.patch(`/workflows/${id}/status`, { status });

export const validateWorkflowDefinition = (definition: WorkflowDefinition) =>
  axiosClient.post('/workflows/validate', { definition });

export const getWorkflowVersions = (id: string) =>
  axiosClient.get(`/workflows/${id}/versions`);

export const createWorkflowVersion = (id: string, definition: WorkflowDefinition) =>
  axiosClient.post(`/workflows/${id}/versions`, { definition });

export const getWorkflowVersion = (id: string, versionNumber: number | string) =>
  axiosClient.get(`/workflows/${id}/versions/${versionNumber}`);

export const validateVersion = (id: string, versionNumber: number | string) =>
  axiosClient.post(`/workflows/${id}/versions/${versionNumber}/validate`);

export const publishVersion = (id: string, versionNumber: number | string) =>
  axiosClient.post(`/workflows/${id}/versions/${versionNumber}/publish`);
