import { z } from "zod";

export const InfisicalConfigurationSchema = z.object({
  host: z.string().url(),
  projectId: z.string(),
  environment: z.string(),
  machineIdentityId: z.string(),
});

export const SecretProviderSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.literal("infisical"),
  label: z.string(),
  configuration: InfisicalConfigurationSchema,
  created_on: z.string().optional(),
});

export const SecretProvidersResponseSchema = z.object({
  secretProviders: z.array(SecretProviderSchema),
});

export type SecretProvider = z.infer<typeof SecretProviderSchema>;
export type SecretProvidersResponse = z.infer<typeof SecretProvidersResponseSchema>;
export type InfisicalConfiguration = z.infer<typeof InfisicalConfigurationSchema>;
