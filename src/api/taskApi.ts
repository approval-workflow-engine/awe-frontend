import { apiClient } from './client';
import {
  PendingTasksResponseSchema,
  TaskDetailSchema,
  CompleteTaskResponseSchema,
  CompleteTaskRequestSchema
} from './schemas/task';
import type { PaginationParams } from '../types';

export const getTasks = (params?: PaginationParams) =>
  apiClient.get('/tasks', PendingTasksResponseSchema, { params });

export const getTask = (id: string) =>
  apiClient.get(`/tasks/${id}`, TaskDetailSchema);

export const completeTask = (id: string, userInput: Record<string, unknown>) =>
  apiClient.post(`/tasks/${id}/complete`, userInput, CompleteTaskResponseSchema, CompleteTaskRequestSchema);
