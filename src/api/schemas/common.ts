import { z } from 'zod';

export const EnvironmentTypeValues = [
  'production',
  'development',
  'staging',
] as const;

export const EnvironmentTypeSchema = z.enum(EnvironmentTypeValues);
export type EnvironmentType = z.infer<typeof EnvironmentTypeSchema>;

export const PaginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: PaginationSchema,
  });

export const ApiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
});

export const PaginationParamsSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});


export const dateTransform = z.union([z.string(), z.date()]).transform((val) =>
  typeof val === 'string' ? val : val.toISOString()
);

export const optionalDateTransform = z.union([z.string(), z.date()]).transform((val) =>
  typeof val === 'string' ? val : val.toISOString()
).nullable();

export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginatedResponse<T> = {
  items: T[];
  pagination: Pagination;
};
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;