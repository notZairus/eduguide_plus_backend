import z from "zod";

export const createTopicSchema = z.object({
  title: z.string().min(4),
});


export const createSectionSchema = z.object({
  title: z.string().min(4),
  topic_id: z.string().min(8)
});