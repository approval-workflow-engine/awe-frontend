import { apiClient } from "../client";
import {
  AvailableProviderSecretsResponseSchema,
  SecretCreateResponseSchema,
  SecretsResponseSchema,
  type AvailableProviderSecretsResponse,
  type Secret,
  type SecretItem,
  type SecretsResponse,
  DeleteSecretResponseSchema,
  type DeleteSecretResponse,
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

  listAvailableByProvider: async (
    providerId: string,
    environment: string,
  ): Promise<AvailableProviderSecretsResponse> => {
    return apiClient.get(
      `/secrets/${providerId}`,
      AvailableProviderSecretsResponseSchema,
      { params: { environment } },
    );
  },

  delete: async (secretId: string): Promise<DeleteSecretResponse> => {
    return apiClient.delete(`/secrets/${secretId}`, DeleteSecretResponseSchema);
  },
};
