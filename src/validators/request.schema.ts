import { z } from "zod";
import { HTTP_METHODS } from "@/lib/constants";

export const sendRequestSchema = z.object({
  method: z.enum(HTTP_METHODS),
  url: z.string().min(1, "Please enter a valid URL (e.g., https://example.com)").trim(),
  headers: z.array(z.object({ key: z.string().trim(), value: z.string().trim() })).optional(),
  body: z.string().optional(),
});

export const saveRequestSchema = z.object({
  collectionId: z.string().nonempty("Collection ID is required"),
  name: z.string().min(1, "Request name is required").trim(),
  method: z.enum(HTTP_METHODS),
  url: z.string().min(1, "Please enter a valid URL (e.g., https://example.com)").trim(),
  headers: z.array(z.object({ key: z.string().trim(), value: z.string().trim() })).optional(),
  body: z.string().optional(),
});