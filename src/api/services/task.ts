import { apiClient } from '../client';
import {
  PendingTasksResponseSchema,
  PendingTasksQueryParamsSchema,
  TaskDetailResponseSchema,
  CompleteTaskRequestSchema,
  CompleteTaskResponseSchema,
  type PendingTasksResponse,
  type TaskDetailResponse,
  type CompleteTaskRequest,
  type CompleteTaskResponse,
  type PendingTasksQueryParams,
  RetryTaskResponseSchema,
  type RetryTaskResponse,
} from '../schemas';

export class TaskService {
  async getPendingTasks(params?: PendingTasksQueryParams): Promise<PendingTasksResponse> {
    const validatedParams = params ? PendingTasksQueryParamsSchema.parse(params) : undefined;
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