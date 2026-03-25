import { apiClient } from './client';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RegisterRequestSchema,
  RegisterResponseSchema,
  ApiKeysResponseSchema,
  CreateApiKeyRequestSchema,
  ApiKeySchema,
  RevokeApiKeyResponseSchema
} from './schemas/auth';

export const registerSystem = (data: { name: string; orgName: string; contactEmail: string; password: string; description?: string }) =>
  apiClient.post('/systems/register', data, RegisterResponseSchema, RegisterRequestSchema);

export const loginSystem = (data: { email: string; password: string }) =>
  apiClient.post('/auth/login', data, LoginResponseSchema, LoginRequestSchema);

export const getApiKeys = () =>
  apiClient.get('/systems/api-keys', ApiKeysResponseSchema);

export const createApiKey = (data: { label?: string }) =>
  apiClient.post('/systems/api-keys', data, ApiKeySchema, CreateApiKeyRequestSchema);

export const revokeApiKey = (keyId: string) =>
  apiClient.patch(`/systems/api-keys/${keyId}/revoke`, {}, RevokeApiKeyResponseSchema);
