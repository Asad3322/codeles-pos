import { z } from "zod";

export const setupSchema = z
  .object({
    bakeryName: z.string().trim().min(2, "Bakery name must be at least 2 characters"),
    ownerName: z.string().trim().min(2, "Owner name must be at least 2 characters"),
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetupInput = z.infer<typeof setupSchema>;
