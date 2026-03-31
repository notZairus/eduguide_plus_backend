import mongoose from "mongoose";

const classroomMemberSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MobileUser",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["student", "instructor"],
      default: "student",
      required: true,
    },
    joined_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 4,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
      minLength: 8,
      maxLength: 8,
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MobileUser",
      required: true,
      index: true,
    },
    handbook_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Handbook",
      required: true,
      index: true,
    },
    members: {
      type: [classroomMemberSchema],
      default: [],
    },
    is_active: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true },
);

classroomSchema.index({ owner_id: 1, createdAt: -1 });

export default mongoose.model("Classroom", classroomSchema);
