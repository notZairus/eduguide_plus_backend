import mongoose, { mongo } from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      minLength: 4,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
    section_id: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      }
    ]
  },
  { timestamps: true },
);

export default mongoose.model("Topic", topicSchema);
