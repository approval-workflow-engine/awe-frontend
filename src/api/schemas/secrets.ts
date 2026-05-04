import { z } from "zod";

import { EnvironmentTypeSchema } from "./common";

// Shape returned by the backend for a secret item (list / create response)
export const SecretItemSchema = z.object({
  id: z.string().optional(),
  environment: EnvironmentTypeSchema,
  key: z.string(),
  provider: z.object({
    id: z.string(),
    label: z.string(),
  }),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

export const SecretSchema = z.object({
  providerId: z.string(),
  environment: z.string().optional(),
  key: z.string(),
});

export const SecretCreateResponseSchema = SecretItemSchema;

export const SecretsResponseSchema = z.object({
  secrets: z.array(SecretItemSchema),
});

export type Secret = z.infer<typeof SecretSchema>;
export type SecretItem = z.infer<typeof SecretItemSchema>;
export type SecretsResponse = z.infer<typeof SecretsResponseSchema>;

export const DeleteSecretResponseSchema = z.any();

