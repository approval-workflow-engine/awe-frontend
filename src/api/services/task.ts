import { apiClient } from '../client';
import {
  PendingTasksResponseSchema,
  TaskDetailResponseSchema,
  CompleteTaskRequestSchema,
  CompleteTaskResponseSchema,
  PaginationParamsSchema,
  type PendingTasksResponse,
  type TaskDetailResponse,
  type CompleteTaskRequest,
  type CompleteTaskResponse,
  type PaginationParams,
  RetryTaskResponseSchema,
  type RetryTaskResponse,
} from '../schemas';

export class TaskService {
  async getPendingTasks(params?: PaginationParams): Promise<PendingTasksResponse> {
    const validatedParams = params ? PaginationParamsSchema.parse(params) : undefined;
    return apiClient.get('/tasks', PendingTasksResponseSchema, {
      params: validatedParams,
    });
  }

  async getTaskDetail(id: string): Promise<TaskDetailResponse> {
    return apiClient.get(`/tasks/${id}`, TaskDetailResponseSchema);
  }

  async completeTask(
    id: string,
    data: CompleteTaskRequest
  ): Promise<CompleteTaskResponse> {
    return apiClient.post(
      `/tasks/${id}/complete`,
      data,
      CompleteTaskResponseSchema,
      CompleteTaskRequestSchema
    );
  }

  async retryTask(id: string): Promise<RetryTaskResponse> {
    return apiClient.post(`/tasks/${id}/retry`, {}, RetryTaskResponseSchema);
  }
}

export const taskService = new TaskService();