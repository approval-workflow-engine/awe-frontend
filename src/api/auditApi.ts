import axiosClient from './axiosClient';
import type { PaginationParams } from '../types';

export const getAuditLogs = (params?: PaginationParams) =>
  axiosClient.get('/audit', { params });

export const getInstanceAudit = (id: string) =>
  axiosClient.get(`/audit/instances/${id}`);
