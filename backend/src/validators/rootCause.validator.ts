import { z } from "zod";

export const rootCauseSchema = z.object({
  rootCause: z
    .string()
    .min(20, "Root cause must be at least 20 characters long"),

  rootCauseCategory: z
    .string()
    .min(1, "Root cause category is required"),
});