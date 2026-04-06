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

function createVerificationEmailHtml(token) {
  return `
  <div style="margin:0;padding:24px;background:#f5f7fb;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr>
        <td style="padding:24px 24px 16px;background:linear-gradient(135deg,#0f766e,#0ea5a0);color:#ffffff;">
          <h1 style="margin:0;font-size:22px;line-height:1.25;font-weight:700;">Verify Your EduGuide Plus Account</h1>
          <p style="margin:8px 0 0;font-size:14px;opacity:0.95;">Use the token below to complete your registration.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Enter this verification token in the app:</p>
          <div style="margin:0 0 16px;padding:14px 16px;background:#ecfeff;border:1px solid #99f6e4;border-radius:10px;text-align:center;">
            <span style="font-size:26px;letter-spacing:4px;font-weight:800;color:#0f766e;">${token}</span>
          </div>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#4b5563;">If you did not request this, you can safely ignore this email.</p>
        </td>
      </tr>
    </table>
  </div>`;
}

function createResetEmailHtml(token, expiresInMinutes) {
  return `
  <div style="margin:0;padding:24px;background:#f5f7fb;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <tr>
        <td style="padding:24px 24px 16px;background:linear-gradient(135deg,#b45309,#f59e0b);color:#ffffff;">
          <h1 style="margin:0;font-size:22px;line-height:1.25;font-weight:700;">Reset Your Password</h1>
          <p style="margin:8px 0 0;font-size:14px;opacity:0.95;">Use this token to reset your EduGuide Plus password.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:14px;line-height:1.6;">Enter this password reset token in the app:</p>
          <div style="margin:0 0 16px;padding:14px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;text-align:center;">
            <span style="font-size:26px;letter-spacing:4px;font-weight:800;color:#b45309;">${token}</span>
          </div>
          <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#4b5563;">This token expires in <strong>${expiresInMinutes} minutes</strong>.</p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#4b5563;">If you did not request this, ignore this email and keep your account secure.</p>
        </td>
      </tr>
    </table>
  </div>`;
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
    from: '"EduGuide Plus" <zairusb12@gmail.com>',
    to: data.email,
    subject: "Verify your EduGuide Plus account",
    text: `Your verification token is ${verification_token}`,
    html: createVerificationEmailHtml(verification_token),
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

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction, // must be true in production (HTTPS)
    sameSite: isProduction ? "none" : "lax", // cross-site cookie for production
    maxAge: 1000 * 60 * 60 * 24 * 365, // optional, 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/refresh",
    maxAge: 1000 * 60 * 60 * 24 * 365 * 2, // optional, 7 days
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
    from: '"EduGuide Plus" <zairusb12@gmail.com>',
    to: data.email,
    subject: "EduGuide Plus password reset token",
    text: `Your password reset token is ${verification_token}. It expires in ${RESET_TOKEN_TTL_MINUTES} minutes.`,
    html: createResetEmailHtml(verification_token, RESET_TOKEN_TTL_MINUTES),
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
