import { Router } from "express";
import { createSectionSchema } from "../validators/handbook.js";
import Section from "../models/Section.js";

const router = Router();

router.get("/", async (req, res) => {
  const sections = await Section.find();

  if (!sections) return res.json({
    sections: []
  })

  return res.status(200).json({
    sections: sections.sort((a, b) => a.order - b.order),
  })
})

router.post("/", async (req, res) => {
  const validationResult = createSectionSchema.safeParse(req.body);

  console.log("hello from handbook post")

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const data = validationResult.data;

  const sections = await Section.find();

  const newSection = await Section.create({ title: data.title, order: sections.length + 1 });

  return res.status(201).send({
    section: {
      id: newSection.id,
      title: newSection.title,
      order: newSection.order
    },
  });
});

router.patch("/:id", async (req, res) => {
  const sectionId = req.params.id;
  const { body } = req;

  console.log("Called")

  const section = await Section.findById(sectionId);

  if (!section) return res.sendStatus(404);

  Object.keys(body).forEach(key => {
    section[key] = body[key];
  });

  await section.save();

  return res.sendStatus(200);
})

router.delete("/:id", async (req, res) => {
  const sectionId = req.params.id;
  await Section.deleteOne({ _id: sectionId });
  return res.sendStatus(200);
})



export default router;
