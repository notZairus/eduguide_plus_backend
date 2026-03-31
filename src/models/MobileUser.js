import mongoose from "mongoose";
import bcrypt from "bcrypt";

const mobileUserSchema = new mongoose.Schema(
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
  },
  { timestamps: true },
);

mobileUserSchema.index({ email: 1, handbook_id: 1 }, { unique: true });

mobileUserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  } catch (err) {
    throw err;
  }
});

export default mongoose.model("MobileUser", mobileUserSchema);
