import { z } from "zod";
export const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    depot: z.string().min(1, "Depot is required"),
});
export const updateUserSchema = createUserSchema.partial();
