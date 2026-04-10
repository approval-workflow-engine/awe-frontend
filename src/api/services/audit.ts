import { apiClient } from "../client";
import {
  InstanceAuditResponseSchema,
  type InstanceAuditResponse,
} from "../schemas/audit";

export class AuditService {
  async getInstanceAudit(instanceId: string): Promise<InstanceAuditResponse> {
    return apiClient.get(`/audit/${instanceId}`, InstanceAuditResponseSchema);
  }
}

export const auditService = new AuditService();
