import z from "zod";

export const createTopicSchema = z.object({
  title: z.string().min(4),
});
