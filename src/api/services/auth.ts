import { apiClient } from "../client";
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RefreshTokenRequestSchema,
  RefreshTokenResponseSchema,
  RegisterRequestSchema,
  RegisterResponseSchema,
  ApiKeysResponseSchema,
  CreateApiKeyRequestSchema,
  CreateApiKeyResponseSchema,
  RevokeApiKeyResponseSchema,
  OrganizationDetailSchema,
  type LoginRequest,
  type LoginResponse,
  type RefreshTokenRequest,
  type RefreshTokenResponse,
  type RegisterRequest,
  type RegisterResponse,
  type ApiKeysResponse,
  type CreateApiKeyRequest,
  type CreateApiKeyResponse,
  type RevokeApiKeyResponse,
  type Organization,
} from "../schemas";
import { z } from "zod";

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post(
      "/auth/login",
      credentials,
      LoginResponseSchema,
      LoginRequestSchema,
    );
  }

  async refreshToken(
    request: RefreshTokenRequest,
  ): Promise<RefreshTokenResponse> {
    return apiClient.post(
      "/auth/refresh",
      request,
      RefreshTokenResponseSchema,
      RefreshTokenRequestSchema,
    );
  }

  async logout(): Promise<{ success: boolean }> {
    return apiClient.post(
      "/auth/logout",
      {},
      z.object({ success: z.boolean() }),
    );
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post(
      "/organizations/register",
      data,
      RegisterResponseSchema,
      RegisterRequestSchema,
    );
  }

  async getCurrentSystem(): Promise<{ system: Organization }> {
    return apiClient.get("/me", z.object({ system: OrganizationDetailSchema }));
  }

  async getApiKeys(): Promise<ApiKeysResponse> {
    return apiClient.get("/api-keys", ApiKeysResponseSchema);
  }

  async createApiKey(data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    return apiClient.post(
      "/api-keys",
      data,
      CreateApiKeyResponseSchema,
      CreateApiKeyRequestSchema,
    );
  }

  async revokeApiKey(keyId: string): Promise<RevokeApiKeyResponse> {
    return apiClient.patch(
      `/api-keys/${keyId}/revoke`,
      {},
      RevokeApiKeyResponseSchema,
    );
  }
}

export const authService = new AuthService();
