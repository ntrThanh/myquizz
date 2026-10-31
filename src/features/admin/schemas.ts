import { z } from "zod";

export const setRoleSchema = z.object({
  userId: z.string().regex(/^[a-f0-9]{24}$/),
  role: z.enum(["user", "editor", "admin"]),
});
