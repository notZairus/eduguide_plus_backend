import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
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
      maxLength: 32,
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
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // only hash if changed

  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  } catch (err) {
    throw err;
  }
});

export default mongoose.model("User", userSchema);
