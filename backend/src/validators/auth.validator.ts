import { z } from 'zod';

// Define the schema for user login
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required.",
      })
      .email("Invalid email format."), // Zod has a built-in email validator!
    
    password: z
      .string({
        required_error: "Password is required.",
      })
      .min(1, "Password cannot be empty."),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];