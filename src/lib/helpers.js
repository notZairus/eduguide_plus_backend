import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function compareHashedPassword(
  plainText,
  hashedText
) {
  return await bcrypt.compare(plainText, hashedText);
}

export function generateAcessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
}

export function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
}
