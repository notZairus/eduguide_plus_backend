import mongoose from "mongoose";


const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    minLength: 8,
    trim: true,
  }, 
  answer: {
    type: String,
    required: true,
    trim: true,
  }, 
  type: {
    type: String,
    required: true,
    trim: true,
    index: true,
  }, 
  explanation: {
    type: String,
    trim: true,
  },
  choices: [{
    type: String,
    trim: true
  }],
  media: {
    type: {
      type: String,
      enum: ['image', 'video'],
    },
    url: {
      type: String,
    },
    public_id: {
      type: String,
    }
  },
  topic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: true,
    index: true,
  },
  section_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section",
    required: true,
    index: true,
  },
}, { timestamps: true });


export default mongoose.model("Question", questionSchema);


