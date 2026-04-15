import { z } from 'zod';
import { EnvironmentTypeSchema } from './common';

export const SystemSchema = z.object({
  id: z.string().uuidv4(),
  name: z.string(),
  orgName: z.string(),
  contactEmail: z.string().email(),
  environment: EnvironmentTypeSchema,
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const RegisterSystemSchema = z.object({
  id: z.string().uuidv4(),
  name: z.string(),
  orgName: z.string(),
  contactEmail: z.string().email(),
  environments: z.array(EnvironmentTypeSchema),
  createdAt: z.string().datetime(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const LoginResponseSchema = z.object({
  system: SystemSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const RegisterRequestSchema = z.object({
  name: z.string().max(255),
  orgName: z.string().max(255),
  contactEmail: z.string().email(),
  password: z.string().min(8),
  description: z.string().optional(),
});

export const RegisterResponseSchema = z.object({
  system: RegisterSystemSchema,
});

export const ApiKeySchema = z.object({
  id: z.string().uuidv4(),
  label: z.string().optional(),
  isRevoked: z.boolean(),
  createdAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
  environment: EnvironmentTypeSchema,
});

export const CreateApiKeyResponseSchema = z.object({
  id: z.string().uuidv4(),
  label: z.string(),
  apiKey: z.string(),
  environment: EnvironmentTypeSchema,
  createdAt: z.string().datetime(),
});

export const CreateApiKeyRequestSchema = z.object({
  label: z.string().min(1).optional(),
  environment: EnvironmentTypeSchema,
});

export const ApiKeysResponseSchema = z.object({
  apiKeys: z.array(ApiKeySchema),
});

export const RevokeApiKeyResponseSchema = z.object({
  id: z.string().uuidv4(),
  label: z.string().nullable().optional(),
  isRevoked: z.boolean(),
  revokedAt: z.string().datetime().nullable(),
});

export type System = z.infer<typeof SystemSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>;
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;
export type ApiKeysResponse = z.infer<typeof ApiKeysResponseSchema>;
export type RevokeApiKeyResponse = z.infer<typeof RevokeApiKeyResponseSchema>;