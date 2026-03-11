import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { generateHTML } from "@tiptap/html";

import { TableKit } from "@tiptap/extension-table";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Selection } from "@tiptap/extensions";

export async function compareHashedPassword(plainText, hashedText) {
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

export function getAuthenticatedId(req, res = null) {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    if (res) {
      return res.sendStatus(401);
    }
    return null;
  }

  const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

  return payload.userId;
}

export function jsonToHTML(content) {
  const extensions = [
    TableKit.configure({ table: { resizable: true } }),
    StarterKit.configure({
      horizontalRule: false,
      link: { openOnClick: false, enableClickSelection: true },
    }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Image,
    Typography,
    Superscript,
    Subscript,
    Selection,
  ];
  const html = generateHTML(content, extensions);

  return html;
}
