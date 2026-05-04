import { apiClient } from "../client";
import {
  SecretCreateResponseSchema,
  SecretsResponseSchema,
  DeleteSecretResponseSchema,
  type Secret,
  type SecretItem,
  type SecretsResponse,
} from "../schemas";

export const secretService = {
  create: async (data: Secret): Promise<SecretItem> => {
    return apiClient.post("/secrets", data, SecretCreateResponseSchema);
  },

  list: async (params?: { providerId?: string; environment?: string }): Promise<SecretsResponse> => {
    return apiClient.get("/secrets", SecretsResponseSchema, { params });
  },

  delete: async (secretId: string): Promise<void> => {
    return apiClient.delete(`/secrets/${secretId}`, DeleteSecretResponseSchema);
  },
};
