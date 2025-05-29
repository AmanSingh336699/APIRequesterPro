import { z } from "zod";

export const envSchema = z.object({
  name: z.string().min(1, "Environment name is required").trim(),
  variables: z.array(
    z.object({
      key: z.string().min(1, "Key is required").trim(),
      value: z.string().trim(),
    })
  ),
});

const variableSchema = z.object({
    key: z.string().min(1, "Key is required").trim(),
    value: z.string().trim(),
});

export const environmentSchema = z.object({
  name: z.string().min(1, "Environment name is required").trim(),
  variables: z.array(variableSchema).optional(),
});

export type EnvironmentFormData = z.infer<typeof environmentSchema>;
