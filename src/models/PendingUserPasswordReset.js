import mongoose from "mongoose";

const pendingUserPasswordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      minLength: 8,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    verification_token: {
      type: String,
      required: true,
      trim: true,
      minLength: 6,
      maxLength: 32,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

pendingUserPasswordResetSchema.index({ email: 1 }, { unique: true });

export default mongoose.model(
  "PendingUserPasswordReset",
  pendingUserPasswordResetSchema,
);
