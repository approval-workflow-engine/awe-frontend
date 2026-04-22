import { z } from "zod";
import { EnvironmentTypeSchema } from "./common";

export const OrganizationBasicSchema = z.object({
  id: z.uuidv4(),
  name: z.string(),
  email: z.email(),
});

export const OrganizationDetailSchema = OrganizationBasicSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const LoginResponseSchema = z.object({
  organization: OrganizationBasicSchema,
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

export const LogoutRequestSchema = z.object({
  refreshToken: z.string().optional(),
});

export const RegisterRequestSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string(),
});

export const RegisterResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  environments: z.array(EnvironmentTypeSchema),
  createdAt: z.string(),
});

export const ApiKeySchema = z.object({
  id: z.string().uuidv4(),
  label: z.string().nullable().optional(),
  prefix: z.string().optional(),
  createdAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
  environment: EnvironmentTypeSchema,
}).transform((apiKey) => ({
  ...apiKey,
  isRevoked: apiKey.revokedAt !== null,
}));

export const CreateApiKeyResponseSchema = z.object({
  id: z.string().uuidv4(),
  label: z.string().nullable().optional(),
  prefix: z.string().optional(),
  apiKey: z.string(),
  environment: EnvironmentTypeSchema,
  createdAt: z.string().datetime(),
});

export const CreateApiKeyRequestSchema = z.object({
  label: z.string().min(1),
  environment: EnvironmentTypeSchema,
});

export const ApiKeysResponseSchema = z.object({
  apiKeys: z.array(ApiKeySchema),
});

export const RevokeApiKeyResponseSchema = z.object({
  revokedAt: z.string().datetime().nullable(),
});

export type Organization = z.infer<typeof OrganizationDetailSchema>;
export type OrganizationBasic = z.infer<typeof OrganizationBasicSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>;
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;
export type ApiKeysResponse = z.infer<typeof ApiKeysResponseSchema>;
export type RevokeApiKeyResponse = z.infer<typeof RevokeApiKeyResponseSchema>;
