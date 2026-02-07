import z from "zod";

// const [data, setData] = useState({
//     topic: "", d
//     section: "", d
//     questionType: "multiple-choice", d
//     question: "", d 
//     answer: "", d
//     explanation: "", d
//     choices d 
//     media d
//   });

export const createQuestionValidator = z.object({
  topicId: z.string().trim(),
  sectionId: z.string().trim(),
  type: z.enum(["multiple-choice", "identification", "true-or-false"]),
  question: z.string().min(8).trim(),
  answer: z.string().trim(),
  explanation: z.string().optional(),
  choices: z.string().optional()
});


export const updateQuestionValidator = z.object({
  topicId: z.string().trim(),
  sectionId: z.string().trim(),
  type: z.enum(["multiple-choice", "identification", "true-or-false"]),
  question: z.string().min(8).trim(),
  answer: z.string().trim(),
  explanation: z.string().optional(),
  choices: z.string().optional()
});