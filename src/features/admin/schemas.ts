import { z } from "zod";
import { ROLES } from "@/lib/types";
import { objectIdSchema } from "@/lib/validation";

export const setRoleSchema = z.object({
  userId: objectIdSchema,
  role: z.enum(ROLES),
});
