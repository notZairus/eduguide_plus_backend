import mongoose from "mongoose";

const pendingPasswordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      minLength: 8,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
      index: true,
    },
    handbook_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Handbook",
      required: true,
      index: true,
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

pendingPasswordResetSchema.index(
  { email: 1, handbook_id: 1 },
  { unique: true },
);

export default mongoose.model(
  "PendingPasswordReset",
  pendingPasswordResetSchema,
);
