import mongoose from "mongoose";

const quizRecordQuestionSchema = new mongoose.Schema(
  {
    question_id: {
      type: String,
      trim: true,
    },
    prompt: {
      type: String,
      trim: true,
    },
    user_answer: {
      type: String,
      trim: true,
      default: "",
    },
    correct_answer: {
      type: String,
      trim: true,
      default: "",
    },
    is_correct: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false },
);

const quizRecordSchema = new mongoose.Schema(
  {
    quiz_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    topic_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MobileUser",
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    total_questions: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    question_results: {
      type: [quizRecordQuestionSchema],
      default: [],
    },
  },
  { timestamps: true },
);

quizRecordSchema.index({ user_id: 1, quiz_id: 1, createdAt: -1 });

export default mongoose.model("QuizRecord", quizRecordSchema);
