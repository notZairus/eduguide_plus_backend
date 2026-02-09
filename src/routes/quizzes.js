import { Router } from "express";
import { createQuizValidator } from "../validators/quizzes.validator.js";
import Quiz from "../models/Quiz.js";
import Topic from "../models/Topic.js";
const router = Router();

router.post("/", async (req, res) => {
  const validationResult = createQuizValidator.safeParse(req.body);

  if (!validationResult.success) {
    console.log("Validation errors:", validationResult.error.format());
    return res.status(400).json({
      errors: validationResult.error.format(),
    });
  }

  const { topic: topic_id, ...validatedData } = validationResult.data;

  const data = {
    ...validatedData,
    time_limit: validatedData.timeLimit,
    passing_score: validatedData.passingScore,
    enable_time_limit: validatedData.enableTimeLimit,
    instant_feedback: validatedData.instantFeedback,
    linked_topic: validatedData.linkedTopic,
  };

  const newQuiz = new Quiz(data);
  const quiz = await newQuiz.save();

  res.status(201).send({
    message: "Quiz created successfully",
    quiz,
  });
});

router.get("/topics/:id", async (req, res) => {
  const { id } = req.params;

  const quizzes = await Quiz.find({ linked_topic: id });

  return res.status(200).send({
    message: "successful!",
    quizzes: quizzes
  })
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const topics = await Topic.find({ active_quiz: id });

  await Topic.updateMany({ active_quiz: id }, { $unset: { active_quiz: "" } })

  await Quiz.findOneAndDelete({ _id: id });
  return res.status(200).send({
    message: "deleted successfully!"
  })
})

export default router;