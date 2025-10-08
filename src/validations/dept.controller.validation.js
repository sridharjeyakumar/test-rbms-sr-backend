import { z } from "zod";

// Validation schema for getting users by department controller
export const getUsersByDeptControllerSchema = z.object({
    role: z.enum(["USER", "JE"]).optional(),
});

// Validation schema for checking if a phone number exists
export const checkPhoneSchema = z.object({
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
});

// Validation schema for creating a new USER under DEPT_CONTROLLER
export const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    depot: z.string().min(1, "Depot is required"),
});

// Validation schema for creating a JE under USER
export const createJESchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    depot: z.string().min(1, "Depot is required"),
    managerId: z.string().uuid("Invalid User ID format"),
});

// Validation schema for updating USER - using partial
export const updateUserSchema = createUserSchema.partial();

// Validation schema for updating JE - using partial
export const updateJESchema = createJESchema.partial();
