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