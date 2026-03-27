import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
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
    is_admin: {
      type: Boolean,
      required: true,
      default: false,
    },
    verification_token: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("PendingUser", pendingUserSchema);
