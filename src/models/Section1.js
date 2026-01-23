import mongoose from "mongoose";

const section1Schema = new mongoose.Schema(
  {
    title: {
      type: String,
      minLength: 4,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Section1", section1Schema);
