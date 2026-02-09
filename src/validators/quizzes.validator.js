import z from "zod";


export const createQuizValidator = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters long"),
  questions: z.array(z.string().trim()).min(1, "At least one question is required"),
  shuffle: z.boolean().optional(),
  instantFeedback: z.boolean().optional(),
  linkedTopic: z.string().trim(),
  enableTimeLimit: z.boolean(),
  timeLimit: z.number().positive().nullable().optional(),
  passingScore: z.number().positive() 
});