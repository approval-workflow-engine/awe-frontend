import axiosClient from './axiosClient';
import type { CompleteTaskPayload, PaginationParams } from '../types';

export const getTasks = (params?: PaginationParams) =>
  axiosClient.get('/tasks', { params });

export const getTask = (id: string) =>
  axiosClient.get(`/tasks/${id}`);

export const completeTask = (id: string, data: CompleteTaskPayload) =>
  axiosClient.post(`/tasks/${id}/complete`, data);
