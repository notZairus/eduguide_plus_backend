import mongoose from "mongoose";

const pendingMobileUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
      minLength: 8,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      minLength: 8,
      required: true,
      trim: true,
    },
    first_name: {
      type: String,
      required: true,
      minLength: 2,
      trim: true,
    },
    middle_name: {
      type: String,
    },
    last_name: {
      type: String,
      required: true,
      minLength: 2,
      trim: true,
    },
    handbook_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Handbook",
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["student", "instructor"],
      lowercase: true,
      trim: true,
    },
    verification_token: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

pendingMobileUserSchema.index({ email: 1, handbook_id: 1 }, { unique: true });

export default mongoose.model("PendingMobileUser", pendingMobileUserSchema);
