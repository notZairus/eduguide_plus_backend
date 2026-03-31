import z from "zod";

export const createQuizValidator = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters long"),
  questions: z
    .array(z.string().trim())
    .min(1, "At least one question is required"),
  shuffle: z.boolean().optional(),
  instantFeedback: z.boolean().optional(),
  linkedTopic: z.string().trim(),
  enableTimeLimit: z.boolean(),
  timeLimit: z.number().positive().nullable().optional(),
  passingScore: z.number().positive(),
});

export const createQuizRecordValidator = z.object({
  topicId: z.string().trim().min(1),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  questionResults: z
    .array(
      z.object({
        questionId: z.string().trim().optional(),
        prompt: z.string().trim().optional(),
        userAnswer: z.string().trim().optional(),
        correctAnswer: z.string().trim().optional(),
        isCorrect: z.boolean(),
      }),
    )
    .optional(),
});
