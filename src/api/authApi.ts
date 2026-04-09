import { apiClient } from './client';
import { API_BASE_URL } from './baseUrl';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RegisterRequestSchema,
  RegisterResponseSchema,
  SystemSchema,
  ApiKeysResponseSchema,
  CreateApiKeyRequestSchema,
  CreateApiKeyResponseSchema,
  RevokeApiKeyResponseSchema
} from './schemas/auth';
import { z } from 'zod';

function logRequestUrl(path: string) {
  const base = API_BASE_URL.replace(/\/$/, '');
  const endpoint = path.replace(/^\//, '');
  console.log(`[API] ${base}/${endpoint}`);
}

export const registerSystem = (data: { name: string; orgName: string; contactEmail: string; password: string; description?: string }) =>
  apiClient.post('/systems/register', data, RegisterResponseSchema, RegisterRequestSchema);

export const loginSystem = (data: { email: string; password: string }) =>
  (logRequestUrl('/auth/login'), apiClient.post('/auth/login', data, LoginResponseSchema, LoginRequestSchema));

export const getCurrentSystem = () =>
  apiClient.get('/systems/me', z.object({ system: SystemSchema }));

export const getApiKeys = () =>
  apiClient.get('/systems/api-keys', ApiKeysResponseSchema);

export const createApiKey = (data: { label?: string }) =>
  apiClient.post('/systems/api-keys', data, CreateApiKeyResponseSchema, CreateApiKeyRequestSchema);

export const revokeApiKey = (keyId: string) =>
  apiClient.patch(`/systems/api-keys/${keyId}/revoke`, {}, RevokeApiKeyResponseSchema);
