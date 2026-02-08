import { Router } from "express";
import { getAuthenticatedId } from "../lib/helpers.js";
import Handbook from "../models/Handbook.js";
import { upload } from "../lib/upload.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


const router = Router();

router.get("/", async (req, res) => {
  const userId = getAuthenticatedId(req);
  const handbook = await Handbook.findOne({ user_id: userId });

  return res.status(200).send({
    message: "successful!",
    handbook: handbook,
  });
});

router.put("/", upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "logo", maxCount: 1 }]), async (req, res) => {
  const userId = getAuthenticatedId(req);

  const body = req.body;
  const thumbnail = req.files.thumbnail ? req.files.thumbnail[0] : null;
  const logo = req.files.logo ? req.files.logo[0] : null;

  const handbook = await Handbook.findOne({ user_id: userId });

  if (!handbook) {
    return res.status(404).send({
      message: "Handbook not found",
    });
  }

  if (thumbnail) {
    if (handbook.thumbnail && handbook.thumbnail.url) {
      await cloudinary.uploader.destroy(handbook.thumbnail.public_id);
    }

    const res = await cloudinary.uploader.upload(thumbnail.path, {
      folder: "EduGuide+/handbooks/thumbnails",
      resource_type: "auto"
    });

    fs.unlink(thumbnail.path, (err) => {
      if (err) console.error("Failed to delete file:", err);
    });

    handbook.thumbnail = { url: res.secure_url, public_id: res.public_id, type: res.resource_type };
  }

  if (logo) {
    if (handbook.logo && handbook.logo.url) {
      await cloudinary.uploader.destroy(handbook.logo.public_id);
    }

    const res = await cloudinary.uploader.upload(logo.path, {
      folder: "EduGuide+/handbooks/logos",
      resource_type: "auto"
    });

    fs.unlink(logo.path, (err) => {
      if (err) console.error("Failed to delete file:", err);
    });
    
    handbook.logo = { url: res.secure_url, public_id: res.public_id, type: res.resource_type };
  }

  for (const key in body) {
    handbook[key] = body[key];
  }

  await handbook.save();

  return res.status(200).send({
    message: "successful!",
    handbook: handbook,
  });
});

export default router;