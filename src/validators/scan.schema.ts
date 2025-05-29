import { z } from 'zod';

export const scanInputSchema = z.object({
  url: z.string().url('Must be a valid URL').startsWith('https://', 'Only HTTPS URLs are supported'),
  headers: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Headers must be valid JSON if provided' }
    )
    .transform((val) => val || '{}'), 
  body: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; 
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Body must be valid JSON if provided' }
    )
    .transform((val) => val || '{}'), 
});