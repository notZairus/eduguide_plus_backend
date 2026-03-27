import { Router } from "express";
import { getAuthenticatedId } from "../lib/helpers.js";
import Handbook from "../models/Handbook.js";
import { upload } from "../lib/upload.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { jsonToHTML } from "../lib/helpers.js";

const router = Router();

router.get("/", async (req, res) => {
  const userId = getAuthenticatedId(req, res);
  const handbook = await Handbook.findOne({ user_id: userId }).populate({
    path: "topics",
    populate: [{ path: "sections" }, { path: "active_quiz" }],
  });

  const sortedTopics = handbook.topics.sort((a, b) => a.order - b.order);
  const sortedAll = sortedTopics.map((topic) => {
    const sortedSections = topic.sections.sort((a, b) => a.order - b.order);
    topic.sections = sortedSections;
    return topic;
  });

  handbook.topics = sortedAll;

  return res.status(200).send({
    message: "successful!",
    handbook: handbook,
  });
});

router.put("/", upload.single("logo"), async (req, res) => {
  const userId = getAuthenticatedId(req, res);

  const body = req.body;
  const logo = req.file ?? null;

  const handbook = await Handbook.findOne({ user_id: userId });

  if (!handbook) {
    return res.status(404).send({
      message: "Handbook not found",
    });
  }

  if (logo) {
    if (handbook.logo && handbook.logo.url) {
      await cloudinary.uploader.destroy(handbook.logo.public_id);
    }

    const res = await cloudinary.uploader.upload(logo.path, {
      folder: "EduGuide+/handbooks/logos",
      resource_type: "auto",
    });

    fs.unlink(logo.path, (err) => {
      if (err) console.error("Failed to delete file:", err);
    });

    handbook.logo = {
      url: res.secure_url,
      public_id: res.public_id,
      type: res.resource_type,
    };
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

router.get("/code/:code", async (req, res) => {
  const code = req.params.code;

  let handbook = await Handbook.findOne({ code: code }).populate({
    path: "topics",
    populate: [
      { path: "sections" },
      { path: "active_quiz", populate: [{ path: "questions" }] },
    ],
  });

  if (!handbook) {
    return res.status(404).send({
      message: "Handbook not found",
    });
  }

  const topics = handbook.topics
    // .sort((a, b) => a.order - b.order)
    .map((topic) => {
      const sections = topic.sections
        // .sort((a, b) => a.order - b.order)
        .map((section) => {
          if (!section.content) {
            return section;
          }

          return {
            ...section._doc,
            content: jsonToHTML(section.content),
          };
        });

      return {
        ...topic._doc,
        sections: sections,
      };
    });

  return res.status(200).send({
    ...handbook._doc,
    topics: topics,
  });
});

export default router;
