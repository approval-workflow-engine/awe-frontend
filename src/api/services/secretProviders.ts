import { apiClient } from "../client";
import {
  SecretProviderSchema,
  SecretProvidersResponseSchema,
  type SecretProvider,
  type SecretProvidersResponse,
} from "../schemas";

export const secretProviderService = {
  list: async (): Promise<SecretProvidersResponse> => {
    return apiClient.get("/secret-providers", SecretProvidersResponseSchema);
  },

  create: async (data: SecretProvider): Promise<SecretProvider> => {
    return apiClient.post("/secret-providers", data, SecretProviderSchema);
  },
};
