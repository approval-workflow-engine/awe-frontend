import axiosClient from "./axiosClient";
import type { PaginationParams } from "../types";
import type { EnvironmentType } from "../constants/environment";

export const getWorkflows = (params?: PaginationParams) =>
  axiosClient.get("/workflows", { params });

export const createWorkflow = (data: { name: string; description?: string }) =>
  axiosClient.post("/workflows", data);

export const getWorkflow = (id: string) =>
  axiosClient.get(`/workflows/${id}`);

export const updateWorkflow = (
  id: string,
  data: { name?: string; description?: string },
) => axiosClient.patch(`/workflows/${id}`, data);

export const deleteWorkflow = (id: string) =>
  axiosClient.delete(`/workflows/${id}`);

export const createWorkflowVersion = (
  id: string,
  payload: Record<string, unknown>,
) => axiosClient.post(`/workflows/${id}/versions`, payload);

export const getWorkflowVersions = (id: string, params?: PaginationParams) =>
  axiosClient.get(`/workflows/${id}/versions`, { params });

export const updateWorkflowVersion = (
  versionId: string,
  payload: Record<string, unknown>,
) => axiosClient.patch(`/workflows/versions/${versionId}`, payload);

export const getWorkflowVersion = (versionId: string) =>
  axiosClient.get(`/workflows/versions/${versionId}`);

export const validateVersion = (versionId: string) =>
  axiosClient.post(`/workflows/versions/${versionId}/validate`);

export const updateVersionStatus = (
  versionId: string,
  status: "published" | "active",
) => {
  if (status === "active") {
    return axiosClient.post(`/workflows/versions/${versionId}/activate`);
  }

  return axiosClient.post(`/workflows/versions/${versionId}/publish`);
};

export const cloneWorkflowVersion = (versionId: string) =>
  axiosClient.post(`/workflows/versions/${versionId}/clone`);

export const promoteWorkflowVersion = (
  versionId: string,
  targetEnvironmentType: EnvironmentType,
) =>
  axiosClient.post(
    `/workflow-versions/${versionId}/promote`,
    {},
    { params: { environmentType: targetEnvironmentType } },
  );
