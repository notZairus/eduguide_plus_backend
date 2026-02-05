import { Router } from "express";
import { upload } from "../lib/upload.js";
import Question from "../models/Question.js";
import { createQuestionValidator } from "../validators/questions.validator.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


const router = Router();

router.post("/", upload.single("file"), async (req, res) => {
  console.log("hello from questions post");
  const { body, file } = req;

  const validationResult = createQuestionValidator.safeParse(body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format()
    })
  }

  const data = validationResult.data;

  const newQuestion = new Question({
    topic_id: data.topicId,
    section_id: data.sectionId,
    type: data.type,
    question: data.question,
    answer: data.answer,
    explanation: data.explanation,
    choices: data.type === "multiple-choice" ? JSON.parse(data.choices) : [],
  })
  
  let result = null;

  if (file) {
    result = await cloudinary.uploader.upload(file.path, {
      folder: "EduGuide+/questions",
      resource_type: "auto",
    })

    fs.unlink(file.path, (err) => {
      if (err) console.error("Failed to delete file:", err);
    });
  }

  if (result) {
    newQuestion.media = {
      url: result.secure_url,
      public_id: result.public_id,
      type: result.resource_type
    }
  }

  const question = await newQuestion.save();

  return res.status(200).send({
    message: "successful!",
    question: question,
  })
})


export default router;