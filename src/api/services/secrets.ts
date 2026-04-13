import { apiClient } from "../client";
import {
  SecretCreateResponseSchema,
  SecretsResponseSchema,
  type Secret,
  type SecretItem,
  type SecretsResponse,
} from "../schemas";

export const secretService = {
  create: async (data: Secret): Promise<SecretItem> => {
    return apiClient.post("/secrets", data, SecretCreateResponseSchema);
  },

  list: async (): Promise<SecretsResponse> => {
    return apiClient.get("/secrets", SecretsResponseSchema);
  },

  listByProvider: async (providerId: string): Promise<SecretsResponse> => {
    return apiClient.get(`/secrets/by-provider/${providerId}`, SecretsResponseSchema);
  },
};
