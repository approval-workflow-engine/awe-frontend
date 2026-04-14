import { z } from "zod";

// Shape returned by the backend for a secret item (list / create response)
export const SecretItemSchema = z.object({
  id: z.string().uuid().optional(),
  providerId: z.string().uuid(),
  label: z.string(),
  key: z.string(),
  environmentType: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).nullable().optional(),
});

// Shape sent when CREATING a secret (request payload)
export const SecretSchema = z.object({
  id: z.string().uuid().optional(),
  providerId: z.string().uuid(),
  environmentType: z.string(),
  label: z.string(),
  key: z.string(),
  created_on: z.string().optional(),
});

// Create response is the full item
export const SecretCreateResponseSchema = SecretItemSchema;

// List response
export const SecretsResponseSchema = z.object({
  secrets: z.array(SecretItemSchema),
});

export type Secret = z.infer<typeof SecretSchema>;
export type SecretItem = z.infer<typeof SecretItemSchema>;
export type SecretsResponse = z.infer<typeof SecretsResponseSchema>;

export const DeleteSecretResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type DeleteSecretResponse = z.infer<typeof DeleteSecretResponseSchema>;
