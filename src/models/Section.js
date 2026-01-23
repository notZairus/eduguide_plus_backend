import mongoose, { mongo } from "mongoose";

const sectionSchema = new mongoose.Schema(
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
    childrens: [
      {
        targetId: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'childrens.targetModel'
        },
        targetModel: {
          type: String,
          enum: ['Content', 'SubSection', 'SubSubSection']
        }
      }
    ]
  },
  { timestamps: true },
);

export default mongoose.model("Section", sectionSchema);
