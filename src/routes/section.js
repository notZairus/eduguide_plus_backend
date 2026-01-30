import { Router } from "express";
import { createSectionSchema } from "../validators/handbook.js";
import Section from "../models/Section.js";
import Topic from "../models/Topic.js";

const router = Router();

router.get("/:id", async (req, res) => {
  const sectionId = req.params.id;

  const section = await Section.findOne({ _id: sectionId });

  if (!section) return res.status(200).send({ message: "section not found!" });

  return res.status(200).send({ 
    section
  })
})

router.post("/", async (req, res) => {
  console.log("hello from sections post.")
  const validationResult = createSectionSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      errors: validationResult.error.format(),
    })
  }

  const topic = await Topic.findById(validationResult.data.topic_id);

  const newSection = await Section.create({
    title: validationResult.data.title,
    order: topic.sections.length + 1
  });

  topic.sections.push(newSection._id);
  topic.save();

  return res.status(201).send({
    section: newSection
  })
});

router.patch("/:id", async (req, res) => {
  const sectionId = req.params.id;
  const { body } = req;
  
  const section = await Section.findById(sectionId);
  
  Object.keys(body).forEach(key => {
    section[key] = body[key];
  })

  const updatedSection = await section.save();
  
  return res.status(200).send({
    section: updatedSection,
  })
})

router.delete("/:id", async (req, res) => {
  const sectionId = req.params.id;
  await Section.findOneAndDelete({ _id: sectionId });
  return res.sendStatus(200);
})

export default router;