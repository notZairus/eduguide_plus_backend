import { Router } from "express";
import nodemailer from "nodemailer";
import { nanoid } from "nanoid";

import MobileUser from "../models/MobileUser.js";
import PendingMobileUser from "../models/PendingMobileUser.js";
import PendingPasswordReset from "../models/PendingPasswordReset.js";
import {
  compareHashedPassword,
  generateAcessToken,
  generateRefreshToken,
  getAuthenticatedId,
} from "../lib/helpers.js";
import {
  forgotPasswordRequestSchema,
  forgotPasswordResetSchema,
  mobileLoginSchema,
  mobileRegisterSchema,
} from "../validators/mobileAuth.validator.js";

const router = Router();

const RESET_TOKEN_TTL_MINUTES = 15;

function createMailTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "zairusb12@gmail.com",
      pass: process.env.GMAIL_PASSWORD,
    },
  });
}

router.post("/validate-registration", async (req, res) => {
  console.log("Received registration validation request:", req.body);

  const validationResult = mobileRegisterSchema.safeParse(req.body);

  if (!validationResult.success) {
    console.log(validationResult.error.format());
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const data = validationResult.data;

  const existingUser = await MobileUser.findOne({
    email: data.email,
    handbook_id: data.handbookId,
  });

  if (existingUser) {
    return res.status(409).send({
      message: "User already exists",
    });
  }

  await PendingMobileUser.deleteOne({
    email: data.email,
    handbook_id: data.handbookId,
  });

  const verification_token = nanoid(10);

  await PendingMobileUser.create({
    email: data.email,
    password: data.password,
    first_name: data.firstName,
    middle_name: data.middleName,
    last_name: data.lastName,
    handbook_id: data.handbookId,
    role: data.role,
    verification_token,
  });

  const transporter = createMailTransporter();

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

  const pendingUser = await PendingMobileUser.findOne({
    email,
    verification_token,
  });

  console.log(pendingUser);

  if (!pendingUser) {
    return res.status(400).send({
      message: "Invalid verification token",
    });
  }

  await MobileUser.create({
    email: pendingUser.email,
    password: pendingUser.password,
    first_name: pendingUser.first_name,
    middle_name: pendingUser.middle_name,
    last_name: pendingUser.last_name,
    handbook_id: pendingUser.handbook_id,
    role: pendingUser.role,
  });

  await PendingMobileUser.deleteOne({ email, verification_token });

  return res.send({
    status: 200,
    message: "User registered successfully",
  });
});

router.post("/login", async (req, res) => {
  const validationResult = mobileLoginSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const data = validationResult.data;

  const user = await MobileUser.findOne({
    email: data.email,
    handbook_id: data.handbookId,
  });

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
    path: "/mobile-auth/refresh",
  });

  return res.status(200).json({
    message: "successful",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.first_name,
      middleName: user.middle_name,
      lastName: user.last_name,
      handbookId: user.handbook_id,
      role: user.role,
    },
  });
});

router.post("/forgot-password/request", async (req, res) => {
  const validationResult = forgotPasswordRequestSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const data = validationResult.data;

  const user = await MobileUser.findOne({
    email: data.email,
    handbook_id: data.handbookId,
  });

  if (!user) {
    return res.status(200).send({
      message:
        "If this account exists, a password reset token has been sent to your email.",
    });
  }

  await PendingPasswordReset.deleteOne({
    email: data.email,
    handbook_id: data.handbookId,
  });

  const verification_token = nanoid(10);
  const expires_at = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60000);

  await PendingPasswordReset.create({
    email: data.email,
    handbook_id: data.handbookId,
    verification_token,
    expires_at,
  });

  const transporter = createMailTransporter();

  await transporter.sendMail({
    to: data.email,
    subject: "Password Reset Token",
    text: `Your password reset token is ${verification_token}. It expires in ${RESET_TOKEN_TTL_MINUTES} minutes.`,
  });

  return res.status(200).send({
    message:
      "If this account exists, a password reset token has been sent to your email.",
  });
});

router.post("/forgot-password/reset", async (req, res) => {
  const validationResult = forgotPasswordResetSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const data = validationResult.data;

  const pendingReset = await PendingPasswordReset.findOne({
    email: data.email,
    handbook_id: data.handbookId,
    verification_token: data.verificationToken,
    expires_at: { $gt: new Date() },
  });

  if (!pendingReset) {
    return res.status(400).send({
      message: "Invalid or expired password reset token",
    });
  }

  const user = await MobileUser.findOne({
    email: data.email,
    handbook_id: data.handbookId,
  });

  if (!user) {
    return res.status(404).send({
      message: "Mobile user not found",
    });
  }

  user.password = data.newPassword;
  await user.save();

  await PendingPasswordReset.deleteMany({
    email: data.email,
    handbook_id: data.handbookId,
  });

  return res.status(200).send({
    message: "Password reset successfully",
  });
});

router.get("/me", async (req, res) => {
  const userId = getAuthenticatedId(req, res);

  if (!userId) {
    return res.status(401).send({
      user: null,
    });
  }

  const user = await MobileUser.findById(userId);

  if (!user) return res.sendStatus(401);

  return res.status(200).send({
    user: {
      id: user._id,
      firstName: user.first_name,
      middleName: user.middle_name,
      lastName: user.last_name,
      handbookId: user.handbook_id,
      role: user.role,
    },
  });
});

router.get("/logout", async (req, res) => {
  res.clearCookie("refreshToken", { path: "/mobile-auth/refresh" });
  res.clearCookie("accessToken");
  return res.sendStatus(200);
});

export default router;
