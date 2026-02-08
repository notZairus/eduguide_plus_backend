import { Router } from "express";
import { upload } from "../lib/upload.js";
import Question from "../models/Question.js";
import { createQuestionValidator, updateQuestionValidator } from "../validators/questions.validator.js";
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
  const question = await Question.findOne({ _id: savedQuestion._id })

  return res.status(200).send({
    message: "successful!",
    question: question,
  })
});

router.get("/", async (req, res) => {
  const userId = getAuthenticatedId(req);
  const questions = await Question.find({ user_id: userId })

  return res.status(200).send({
    message: "successful!",
    questions: questions,
  })
});

router.put("/:id", upload.single("file"), async (req, res) => {
  const questionId = req.params.id;
  const { body, file } = req;

  const validationResult = updateQuestionValidator.safeParse(body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format()
    })
  }

  const data = validationResult.data;
  const question = await Question.findById(questionId);

  question.topic_id = data.topicId;
  question.section_id = data.sectionId;
  question.type = data.type;
  question.question = data.question;
  question.answer = data.answer;
  question.explanation = data.explanation;
  question.choices = data.type === "multiple-choice" ? JSON.parse(data.choices) : [];

  if (file) {
    if (question.media && question.media.public_id) {
      try {
        await cloudinary.uploader.destroy(question.media.public_id);
      } catch (err) {
        console.error("Failed to delete old media from Cloudinary:", err);
      }
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "EduGuide+/questions",
      resource_type: "auto",
    })

    fs.unlink(file.path, (err) => {
      if (err) console.error("Failed to delete file:", err);
    });

    question.media = {
      url: result.secure_url,
      public_id: result.public_id,
      type: result.resource_type
    }
  } 

  const updatedQuestion = await question.save();

  return res.status(200).send({
    message: "Updated successfully!",
    question: updatedQuestion,
  })
});

router.delete("/:id", async (req, res) => {
  const questionId = req.params.id;
  await Question.findOneAndDelete({ _id: questionId });
  return res.status(200).send({
    message: "Deleted successfully."
  })
});


export default router;