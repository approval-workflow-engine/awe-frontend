import { apiClient } from "../client";
import { DashboardResponseSchema, type DashboardResponse } from "../schemas";

export class DashboardService {
  async getDashboard(): Promise<DashboardResponse> {
    return apiClient.get("/systems/dashboard", DashboardResponseSchema);
  }
}

export const dashboardService = new DashboardService();