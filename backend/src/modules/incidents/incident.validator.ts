import { z } from "zod";

export const incidentSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters"),

  severity: z.enum([
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
  ]),

  category: z
    .string()
    .min(2, "Category is required"),

  subcategory: z.string().min(2).optional(),

  occurrenceAt: z.coerce.date().optional(),

  location: z
    .string()
    .min(2, "Location is required"),

  departmentId: z.coerce.number()
});

// 1. Reject Incident Schema
export const rejectIncidentSchema = z.object({
  body: z.object({
    reason: z.string()
      .min(10, "Rejection reason must be at least 10 characters long.")
      .max(500, "Rejection reason cannot exceed 500 characters.")
      .trim(),
  }),
});

export type RejectIncidentInput = z.infer<typeof rejectIncidentSchema>['body'];

// 2. Assign Investigator Schema
export const assignInvestigatorSchema = z.object({
  body: z.object({
    investigatorId: z.number()
      .int("Investigator ID must be an integer.")
      .positive("Investigator ID must be a positive number."),
  }),
});

export type AssignInvestigatorInput = z.infer<typeof assignInvestigatorSchema>['body'];

// 3. Assign Action Owner Schema
export const assignActionOwnerSchema = z.object({
  body: z.object({
    actionOwnerId: z.number()
      .int("Action Owner ID must be an integer.")
      .positive("Action Owner ID must be a positive number."),
  }),
});

export type AssignActionOwnerInput = z.infer<typeof assignActionOwnerSchema>['body'];

// 4. Department Incidents Params Schema
export const departmentParamsSchema = z.object({
  departmentId: z
    .string()
    .regex(/^[1-9]\d*$/, "Department ID must be a positive integer.")
    .transform(Number),
});
