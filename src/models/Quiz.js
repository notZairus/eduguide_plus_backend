import mongoose from "mongoose";


const QuizSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    randomized: {
      type: Boolean,
      default: false,
    },  
    instant_feedback: {
      type: Boolean,
      default: false,
    },
    time_limit: {
      type: Number, // Time limit in minutes
    },
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    }],
  }, { timestamps: true });