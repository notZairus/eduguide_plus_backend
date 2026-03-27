import mongoose from "mongoose";

const handbookSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      minLength: 16,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    topics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
      },
    ],
    logo: {
      type: {
        type: String,
        enum: ["image", "video"],
      },
      url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    color: {
      type: String,
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Handbook", handbookSchema);
