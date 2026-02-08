import { Router } from "express";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import User from "../models/User.js";
import {
  compareHashedPassword,
  generateAcessToken,
  generateRefreshToken,
} from "../lib/helpers.js";
import jwt from "jsonwebtoken";
import Handbook from "../models/Handbook.js";

const router = Router();

router.post("/login", async (req, res) => {
  console.log("hello from /login");
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
  });
});

router.get("/logout", async (req, res) => {
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  return res.sendStatus(200);
});


router.post("/register", async (req, res) => {
  const validationResult = registerSchema.safeParse(req.body);

  if (!validationResult.success) {
    console.log(validationResult.error.format())
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const data = validationResult.data;

  const user = new User({
    email: data.email,
    password: data.password,
    first_name: data.firstName,
    middle_name: data.middleName,
    last_name: data.lastName,
    is_admin: false,
  });

  const newUser = await user.save();

  await Handbook.create({
    title: "My Handbook",
    description: "This is a handbook description.",
    user_id: newUser._id,
    color: "#276fb5",
  });

  return res.status(200).send({
    user: {
      id: user.id,
    },
    message: "successful!",
  });
});

router.get("/me", async (req, res) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).send({
      user: null,
    });
  }

  const payload = jwt.verify(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET,
  );

  const user = await User.findById(payload.userId);

  if (!user) return res.sendStatus(401);

  return res.status(200).send({
    user: user.email,
  });
});

export default router;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// router.post("/refresh", async (req, res) => {
//   interface JwtPayload {
//     userId: string;
//     iat: number;
//     exp: number;
//   }

//   const refreshToken = req.cookies.refreshToken;

//   if (!refreshToken) {
//     return res.sendStatus(401);
//   }

//   let payload: JwtPayload;

//   try {
//     payload = jwt.verify(
//       refreshToken,
//       process.env.REFRESH_TOKEN_SECRET as string,
//     ) as JwtPayload;
//   } catch (err) {
//     return res.sendStatus(403);
//   }

//   const user = await User.findById(payload.userId);

//   if (!user) {
//     return res.sendStatus(401);
//   }

//   const newAccessToken = generateAcessToken({ userId: user.id });

//   res.cookie("accessToken", newAccessToken, {
//     httpOnly: true,
//     secure: false, // set true in production with HTTPS
//     sameSite: "lax",
//   });

//   return res.status(200).json({
//     message: "token refreshed",
//   });
// });
