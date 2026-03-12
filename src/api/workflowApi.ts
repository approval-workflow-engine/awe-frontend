import axiosClient from './axiosClient';
import type { PaginationParams } from '../types';

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

export const createWorkflowVersion = (id: string, payload: Record<string, unknown>) =>
  axiosClient.post(`/workflows/${id}/versions`, payload);

export const updateWorkflowVersion = (id: string, versionNumber: number | string, payload: Record<string, unknown>) =>
  axiosClient.patch(`/workflows/${id}/versions/${versionNumber}`, payload);

export const getWorkflowVersion = (id: string, versionNumber: number | string) =>
  axiosClient.get(`/workflows/${id}/versions/${versionNumber}`);

export const validateVersion = (id: string, versionNumber: number | string) =>
  axiosClient.post(`/workflows/${id}/versions/${versionNumber}/validate`);

export const updateVersionStatus = (id: string, versionNumber: number | string, status: string) =>
  axiosClient.patch(`/workflows/${id}/versions/${versionNumber}/status`, { status });
