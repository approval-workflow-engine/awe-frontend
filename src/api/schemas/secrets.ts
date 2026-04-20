import { z } from "zod";

// Shape returned by the backend for a secret item (list / create response)
export const SecretItemSchema = z.object({
  id: z.string().uuid().optional(),
  providerId: z.string().uuid(),
  label: z.string(),
  key: z.string(),
  environment: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).nullable().optional(),
});

export const SecretSchema = z.object({
  id: z.string().uuid().optional(),
  providerId: z.string().uuid(),
  environment: z.string(),
  key: z.string(),
  created_on: z.string().optional(),
});

export const SecretCreateResponseSchema = SecretItemSchema;

export const SecretsResponseSchema = z.object({
  secrets: z.array(SecretItemSchema),
});

export const AvailableProviderSecretsResponseSchema = z.object({
  secrets: z.array(z.string()),
});

export type Secret = z.infer<typeof SecretSchema>;
export type SecretItem = z.infer<typeof SecretItemSchema>;
export type SecretsResponse = z.infer<typeof SecretsResponseSchema>;
export type AvailableProviderSecretsResponse = z.infer<
  typeof AvailableProviderSecretsResponseSchema
>;

export const DeleteSecretResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type DeleteSecretResponse = z.infer<typeof DeleteSecretResponseSchema>;
