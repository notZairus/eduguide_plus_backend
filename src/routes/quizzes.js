import { Router } from "express";
import {
  createQuizRecordValidator,
  createQuizValidator,
} from "../validators/quizzes.validator.js";
import Quiz from "../models/Quiz.js";
import Topic from "../models/Topic.js";
import QuizRecord from "../models/QuizRecord.js";
import { getAuthenticatedId } from "../lib/helpers.js";
import MobileUser from "../models/MobileUser.js";
import Handbook from "../models/Handbook.js";
import Classroom from "../models/Classroom.js";
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
    quizzes: quizzes,
  });
});

router.post("/:quizId/records", async (req, res) => {
  const userId = getAuthenticatedId(req, res);

  if (!userId) return;

  const validationResult = createQuizRecordValidator.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const user = await MobileUser.findById(userId);

  if (!user) {
    return res.status(404).send({
      message: "Mobile user not found",
    });
  }

  const quiz = await Quiz.findById(req.params.quizId);

  if (!quiz) {
    return res.status(404).send({
      message: "Quiz not found",
    });
  }

  const quizRecord = await QuizRecord.create({
    quiz_id: quiz._id,
    topic_id: validationResult.data.topicId,
    user_id: user._id,
    score: validationResult.data.score,
    total_questions: validationResult.data.totalQuestions,
    percentage: validationResult.data.percentage,
    question_results: (validationResult.data.questionResults || []).map(
      (questionResult) => ({
        question_id: questionResult.questionId || "",
        prompt: questionResult.prompt || "",
        user_answer: questionResult.userAnswer || "",
        correct_answer: questionResult.correctAnswer || "",
        is_correct: questionResult.isCorrect,
      }),
    ),
  });

  return res.status(201).send({
    message: "Quiz result recorded successfully",
    quizRecord,
  });
});

router.get("/records/me-active", async (req, res) => {
  const userId = getAuthenticatedId(req, res);

  if (!userId) return;

  const user = await MobileUser.findById(userId);

  if (!user) {
    return res.status(404).send({
      message: "Mobile user not found",
    });
  }

  if (user.role !== "student") {
    return res.status(403).send({
      message: "Only students can view quiz records",
    });
  }

  const handbook = await Handbook.findById(user.handbook_id).populate({
    path: "topics",
    populate: [{ path: "active_quiz" }],
  });

  if (!handbook) {
    return res.status(404).send({
      message: "Handbook not found",
    });
  }

  const activeTopics = (handbook.topics || []).filter(
    (topic) => topic.active_quiz,
  );

  const activeQuizIds = activeTopics.map((topic) => topic.active_quiz._id);

  const records = await QuizRecord.find({
    user_id: user._id,
    quiz_id: { $in: activeQuizIds },
  })
    .sort({ createdAt: -1 })
    .lean();

  const latestRecordByQuizId = new Map();
  const attemptCountByQuizId = new Map();
  const bestPercentageByQuizId = new Map();

  records.forEach((record) => {
    const quizId = record.quiz_id.toString();

    if (!latestRecordByQuizId.has(quizId)) {
      latestRecordByQuizId.set(quizId, record);
    }

    const currentCount = attemptCountByQuizId.get(quizId) || 0;
    attemptCountByQuizId.set(quizId, currentCount + 1);

    const currentBest = bestPercentageByQuizId.get(quizId) || 0;
    bestPercentageByQuizId.set(
      quizId,
      Math.max(currentBest, record.percentage),
    );
  });

  const quizRecords = activeTopics.map((topic) => {
    const quizId = topic.active_quiz._id.toString();
    const latestRecord = latestRecordByQuizId.get(quizId) || null;

    return {
      topicId: topic._id,
      topicTitle: topic.title,
      quizId: topic.active_quiz._id,
      quizTitle: topic.active_quiz.title || "Untitled Quiz",
      attemptCount: attemptCountByQuizId.get(quizId) || 0,
      bestPercentage: bestPercentageByQuizId.get(quizId) || 0,
      latestRecord: latestRecord
        ? {
            score: latestRecord.score,
            totalQuestions: latestRecord.total_questions,
            percentage: latestRecord.percentage,
            createdAt: latestRecord.createdAt,
          }
        : null,
    };
  });

  return res.status(200).send({
    quizRecords,
  });
});

router.get(
  "/records/classrooms/:classroomId/students/:studentId/active",
  async (req, res) => {
    const userId = getAuthenticatedId(req, res);

    if (!userId) return;

    const user = await MobileUser.findById(userId);

    if (!user) {
      return res.status(404).send({
        message: "Mobile user not found",
      });
    }

    if (user.role !== "instructor") {
      return res.status(403).send({
        message: "Only instructors can view student quiz records",
      });
    }

    const classroom = await Classroom.findOne({
      _id: req.params.classroomId,
      owner_id: user._id,
      is_active: true,
    });

    if (!classroom) {
      return res.status(404).send({
        message: "Classroom not found",
      });
    }

    const student = await MobileUser.findById(req.params.studentId).select(
      "first_name middle_name last_name email role handbook_id",
    );

    if (!student || student.role !== "student") {
      return res.status(404).send({
        message: "Student not found",
      });
    }

    const isStudentMember = classroom.members.some(
      (member) =>
        member.role === "student" &&
        member.user_id.toString() === student._id.toString(),
    );

    if (!isStudentMember) {
      return res.status(403).send({
        message: "Student is not a member of this classroom",
      });
    }

    const handbook = await Handbook.findById(classroom.handbook_id).populate({
      path: "topics",
      populate: [{ path: "active_quiz" }],
    });

    if (!handbook) {
      return res.status(404).send({
        message: "Handbook not found",
      });
    }

    const activeTopics = (handbook.topics || []).filter(
      (topic) => topic.active_quiz,
    );
    const activeQuizIds = activeTopics.map((topic) => topic.active_quiz._id);

    const records = await QuizRecord.find({
      user_id: student._id,
      quiz_id: { $in: activeQuizIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const latestRecordByQuizId = new Map();
    const attemptCountByQuizId = new Map();
    const bestPercentageByQuizId = new Map();

    records.forEach((record) => {
      const quizId = record.quiz_id.toString();

      if (!latestRecordByQuizId.has(quizId)) {
        latestRecordByQuizId.set(quizId, record);
      }

      const currentCount = attemptCountByQuizId.get(quizId) || 0;
      attemptCountByQuizId.set(quizId, currentCount + 1);

      const currentBest = bestPercentageByQuizId.get(quizId) || 0;
      bestPercentageByQuizId.set(
        quizId,
        Math.max(currentBest, record.percentage),
      );
    });

    const quizRecords = activeTopics.map((topic) => {
      const quizId = topic.active_quiz._id.toString();
      const latestRecord = latestRecordByQuizId.get(quizId) || null;

      return {
        topicId: topic._id,
        topicTitle: topic.title,
        quizId: topic.active_quiz._id,
        quizTitle: topic.active_quiz.title || "Untitled Quiz",
        attemptCount: attemptCountByQuizId.get(quizId) || 0,
        bestPercentage: bestPercentageByQuizId.get(quizId) || 0,
        latestRecord: latestRecord
          ? {
              score: latestRecord.score,
              totalQuestions: latestRecord.total_questions,
              percentage: latestRecord.percentage,
              createdAt: latestRecord.createdAt,
            }
          : null,
      };
    });

    return res.status(200).send({
      student: {
        _id: student._id,
        first_name: student.first_name,
        middle_name: student.middle_name,
        last_name: student.last_name,
        email: student.email,
      },
      classroom: {
        _id: classroom._id,
        name: classroom.name,
        code: classroom.code,
      },
      quizRecords,
    });
  },
);

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const topics = await Topic.find({ active_quiz: id });

  await Topic.updateMany({ active_quiz: id }, { $unset: { active_quiz: "" } });

  await Quiz.findOneAndDelete({ _id: id });
  await QuizRecord.deleteMany({ quiz_id: id });
  return res.status(200).send({
    message: "deleted successfully!",
  });
});

export default router;
