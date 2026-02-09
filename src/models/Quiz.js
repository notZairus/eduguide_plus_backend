import mongoose from "mongoose";

const QuizSchema = new mongoose.Schema({ 
    title: {
      type: String,
      required: true,
    },
    shuffle: {
      type: Boolean,
      default: false,
    },  
    instant_feedback: {
      type: Boolean,
      default: false,
    },
    enable_time_limit: {
      type:Boolean,
      required: true,
    },
    time_limit: {
      type: Number, // Time limit in minutes
    },
    passing_score: {
      type: Number,
      required: true,
    },
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    }],
    linked_topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    }
  }, { timestamps: true });

export default mongoose.model("Quiz", QuizSchema);