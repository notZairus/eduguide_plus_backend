import { Router } from "express";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import User from "../models/User.js";
import {
  compareHashedPassword,
  generateAcessToken,
  generateRefreshToken,
} from "../lib/helpers.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { nanoid } from "nanoid";
import PendingUser from "../models/PendingUser.js";
import Handbook from "../models/Handbook.js";

const router = Router();

router.post("/login", async (req, res) => {
  const validationResult = loginSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const data = validationResult.data;

  const user = await User.findOne({ email: data.email });

  if (!user) {
    return res.status(404).send("Invalid Credentials");
  }

  if (!(await compareHashedPassword(data.password, user.password))) {
    return res.status(404).send("Invalid Credentials");
  }

  const accessToken = generateAcessToken({ userId: user.id });

  const refreshToken = generateRefreshToken({ userId: user.id });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/refresh",
  });

  return res.status(200).json({
    message: "successful",
    user: {
      id: user._id,
      firstName: user.first_name,
      middleName: user.middle_name,
      lastName: user.last_name,
      isAdmin: user.is_admin,
    },
  });
});

router.get("/logout", async (req, res) => {
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  return res.sendStatus(200);
});

router.get("/me", async (req, res) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).send({
      user: null,
    });
  }

  const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

  const user = await User.findById(payload.userId);

  if (!user) return res.sendStatus(401);

  return res.status(200).send({
    user: {
      id: user._id,
      firstName: user.first_name,
      middleName: user.middle_name,
      lastName: user.last_name,
      isAdmin: user.is_admin,
    },
  });
});

router.post("/validate-registration", async (req, res) => {
  const validationResult = registerSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const data = validationResult.data;

  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    return res.send({
      status: 409,
      message: "User already exists",
    });
  }

  await PendingUser.deleteOne({ email: data.email });

  const verification_token = nanoid(10);

  await PendingUser.create({
    email: data.email,
    password: data.password,
    first_name: data.firstName,
    middle_name: data.middleName,
    last_name: data.lastName,
    verification_token: verification_token,
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "zairusb12@gmail.com",
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    to: data.email,
    subject: "Your Verification Token",
    text: `Your verification token is ${verification_token}`,
  });

  return res.send({
    status: 200,
    message: "verification token sent",
  });
});

router.post("/verify-registration", async (req, res) => {
  const { email, verification_token } = req.body;

  const pendingUser = await PendingUser.findOne({ email, verification_token });

  if (!pendingUser) {
    return res.status(400).send({
      message: "Invalid verification token",
    });
  }

  const user = new User({
    email: pendingUser.email,
    password: pendingUser.password,
    first_name: pendingUser.first_name,
    middle_name: pendingUser.middle_name,
    last_name: pendingUser.last_name,
    is_admin: false,
  });

  const newUser = await user.save();

  await Handbook.create({
    code: nanoid(16),
    title: "My Handbook",
    description: "This is a handbook description.",
    user_id: newUser._id,
    color: "#142e67",
  });

  await PendingUser.deleteOne({ email, verification_token });

  return res.send({
    status: 200,
    message: "User registered successfully",
  });
});

export default router;
