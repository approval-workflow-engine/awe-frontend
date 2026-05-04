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

export const SecretProviderSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  type: SecretProviderTypeSchema,
  configuration: InfisicalConfigurationSchema,
  modifiedAt: z.union([z.string(), z.date()]).optional(),
});

export const SecretProvidersResponseSchema = z.object({
  secretProviders: z.array(SecretProviderSchema),
});

export type SecretProvider = z.infer<typeof SecretProviderSchema>;
export type SecretProvidersResponse = z.infer<typeof SecretProvidersResponseSchema>;
export type InfisicalConfiguration = z.infer<typeof InfisicalConfigurationSchema>;
