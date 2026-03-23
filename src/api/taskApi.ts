import axiosClient from './axiosClient';
import type { PaginationParams } from '../types';

export const getTasks = (params?: PaginationParams) =>
  axiosClient.get('/tasks', { params });

export const getTask = (id: string) =>
  axiosClient.get(`/tasks/${id}`);

export const completeTask = (id: string, userInput: Record<string, unknown>) =>
  axiosClient.post(`/tasks/${id}/complete`, userInput);
