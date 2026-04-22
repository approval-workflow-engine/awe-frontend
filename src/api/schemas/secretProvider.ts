import { z } from "zod";

export const InfisicalConfigurationSchema = z.object({
  host: z.string().url(),
  projectId: z.string(),
  environment: z.string(),
  machineIdentityId: z.string(),
});

const SecretProviderTypeSchema = z
  .enum(["infisical", "aws-secrets-manager", "hashicorp-vault"])
  .or(z.string());

const SecretProviderConfigurationSchema = z.union([
  InfisicalConfigurationSchema,
  z.record(z.string(), z.unknown()),
]);

export const SecretProviderSchema = z.object({
  id: z.string().uuid().optional(),
  type: SecretProviderTypeSchema,
  label: z.string().nullable().optional(),
  configuration: SecretProviderConfigurationSchema,
  created_on: z.string().nullable().optional(),
  updated_on: z.string().nullable().optional(),
  organization_id: z.string().nullable().optional(),
});

export const SecretProvidersResponseSchema = z.object({
  secretProviders: z.array(SecretProviderSchema),
});

export type SecretProvider = z.infer<typeof SecretProviderSchema>;
export type SecretProvidersResponse = z.infer<typeof SecretProvidersResponseSchema>;
export type InfisicalConfiguration = z.infer<typeof InfisicalConfigurationSchema>;
