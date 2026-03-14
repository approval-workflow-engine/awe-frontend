import axiosClient from './axiosClient';
import type { LoginPayload, RegisterPayload } from '../types';

export const registerSystem = (data: RegisterPayload) =>
  axiosClient.post('/systems/register', data);

export const loginSystem = (data: LoginPayload) =>
  axiosClient.post('/auth/login', data);

export const getApiKeys = () =>
  axiosClient.get('/systems/api-keys');

export const createApiKey = (data: { label?: string }) =>
  axiosClient.post('/systems/api-keys', data);

export const revokeApiKey = (keyId: string) =>
  axiosClient.patch(`/systems/api-keys/${keyId}/revoke`);
