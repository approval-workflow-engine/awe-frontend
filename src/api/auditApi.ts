import { apiClient } from './client';
import { InstanceAuditResponseSchema } from './schemas/audit';

export const getInstanceAudit = (instanceId: string) =>
  apiClient.get(`/audit/${instanceId}`, InstanceAuditResponseSchema);
