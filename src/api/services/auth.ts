import { apiClient } from '../client';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  LogoutRequestSchema,
  RefreshTokenRequestSchema,
  RefreshTokenResponseSchema,
  RegisterRequestSchema,
  RegisterResponseSchema,
  ApiKeysResponseSchema,
  CreateApiKeyRequestSchema,
  CreateApiKeyResponseSchema,
  RevokeApiKeyResponseSchema,
  SystemSchema,
  type LoginRequest,
  type LoginResponse,
  type LogoutRequest,
  type RefreshTokenRequest,
  type RefreshTokenResponse,
  type RegisterRequest,
  type RegisterResponse,
  type ApiKeysResponse,
  type CreateApiKeyRequest,
  type CreateApiKeyResponse,
  type RevokeApiKeyResponse,
  type System,
} from '../schemas';
import { z } from 'zod';

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post(
      '/auth/login',
      credentials,
      LoginResponseSchema,
      LoginRequestSchema
    );
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return apiClient.post(
      '/auth/refresh',
      request,
      RefreshTokenResponseSchema,
      RefreshTokenRequestSchema
    );
  }

  async logout(request: LogoutRequest = {}): Promise<Record<string, never>> {
    return apiClient.post(
      '/auth/logout',
      request,
      z.object({}),
      LogoutRequestSchema,
    );
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post(
      '/systems/register',
      data,
      RegisterResponseSchema,
      RegisterRequestSchema
    );
  }

  async getCurrentSystem(): Promise<{ system: System }> {
    return apiClient.get('/systems/me', z.object({ system: SystemSchema }));
  }

  async getApiKeys(): Promise<ApiKeysResponse> {
    return apiClient.get('/systems/api-keys', ApiKeysResponseSchema);
  }

  async createApiKey(data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    return apiClient.post(
      '/systems/api-keys',
      data,
      CreateApiKeyResponseSchema,
      CreateApiKeyRequestSchema
    );
  }

  async revokeApiKey(keyId: string): Promise<RevokeApiKeyResponse> {
    return apiClient.patch(
      `/systems/api-keys/${keyId}/revoke`,
      {},
      RevokeApiKeyResponseSchema
    );
  }
}

export const authService = new AuthService();