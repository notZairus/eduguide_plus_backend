import { Router } from "express";
import { upload } from "../lib/upload.js";
import Question from "../models/Question.js";
import { createQuestionValidator } from "../validators/questions.validator.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { getAuthenticatedId } from "../lib/helpers.js";


const router = Router();

router.post("/", upload.single("file"), async (req, res) => {
  const { body, file } = req;

  const validationResult = createQuestionValidator.safeParse(body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format()
    })
  }

  const data = validationResult.data;
  const userId = getAuthenticatedId(req); 

  const newQuestion = new Question({
    user_id: userId,
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

  const savedQuestion = await newQuestion.save();
  const question = await Question.findOne({ _id: savedQuestion._id }).populate("section_id").populate("topic_id");

  return res.status(200).send({
    message: "successful!",
    question: question,
  })
})

router.get("/", async (req, res) => {
  const userId = getAuthenticatedId(req);
  const questions = await Question.find({ user_id: userId }).populate("section_id").populate("topic_id");

  return res.status(200).send({
    message: "successful!",
    questions: questions,
  })
})

router.delete("/:id", async (req, res) => {
  const questionId = req.params.id;
  await Question.findOneAndDelete({ _id: questionId });
  return res.status(200).send({
    message: "Deleted successfully."
  })
})


export default router;