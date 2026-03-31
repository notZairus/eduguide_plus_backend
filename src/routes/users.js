import { Router } from "express";
import { getAuthenticatedId } from "../lib/helpers.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

const router = Router();

router.patch("/me", async (req, res) => {
  const dataaa = req.body;
  const authenticated = getAuthenticatedId(req, res);
  const user = await User.findById(authenticated);

  if (!authenticated || !user) {
    return res.status(401).send({
      message: "Unauthorized",
    });
  }

  Object.keys(dataaa).forEach((key) => {
    user[key] = dataaa[key];
  });

  const updatedUser = await user.save();

  return res.status(200).send({
    message: "User updated successfully",
    user: updatedUser,
  });
});

router.patch("/me/password", async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  const authenticated = getAuthenticatedId(req, res);
  const user = await User.findById(authenticated);

  if (!authenticated || !user) {
    return res.status(401).send({
      message: "Unauthorized",
    });
  }

  const isMatch = await bcrypt.compare(current_password, user.password);

  if (!isMatch) {
    return res.status(400).send({
      message: "Current password is incorrect",
    });
  }

  console.log(new_password, confirm_password);

  if (new_password !== confirm_password) {
    return res.status(400).send({
      message: "New password and confirm password do not match",
    });
  }

  user.password = new_password;
  await user.save();

  return res.status(200).send({
    message: "Password updated successfully",
  });
});

export default router;
