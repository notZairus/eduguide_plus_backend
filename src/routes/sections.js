import { Router } from "express";
import { createSectionSchema } from "../validators/handbook.validator.js";
import Section from "../models/Section.js";
import Topic from "../models/Topic.js";
import { upload } from "../lib/upload.js"; 
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

// ROUTES /////////////////////////

router.get("/:id", async (req, res) => {
  const sectionId = req.params.id;

  const section = await Section.findOne({ _id: sectionId });

  if (!section) return res.status(200).send({ message: "section not found!" });

  return res.status(200).send({ 
    section
  })
})

router.post("/", async (req, res) => {
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

router.patch("/:id", upload.array("files"), async (req, res) => {
  console.log("PATCH /sections/:id called");
  const sectionId = req.params.id;
  const body = req.body;
  const files = req.files;

  const section = await Section.findById(sectionId);

  if (body.title) {
    section.title = body.title;
    const updatedSection = await section.save();
    return res.status(200).send({
      section: updatedSection
    })
  }

  if (body.order) {
    section.order = body.order;
    const updatedSection = await section.save();
    return res.status(200).send({
      section: updatedSection
    })
  }

  if (body.content || body.medias) {
    const updatedSection = await updateSectionContent(section, body, files);
    return res.status(200).send({
      section: updatedSection,
    })
  }  
})

router.delete("/:id", async (req, res) => {
  const sectionId = req.params.id;
  await Section.findOneAndDelete({ _id: sectionId });
  return res.sendStatus(200);
})



// HELPER FUNCTIONS /////////////////////////

async function updateSectionContent(section, body, files) {
  const currentMedias = section.medias;
  const updatedMedias = JSON.parse(body.medias).map(media => media.url);

  for (const media of currentMedias) {
    if (!updatedMedias.includes(media.url)) {
      await cloudinary.uploader.destroy(media.public_id, function(error, result) {
        console.log(result, error);
      });
    }
  }

  Object.keys(body).forEach(key => {
    section[key] = ["medias", "content"].includes(key) ? JSON.parse(body[key]) : body[key];
  });

  for (const file of files) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "EduGuide+/sections",
      resource_type: "auto",
    })
      
    section.medias.push({ 
      url: result.secure_url, 
      public_id: result.public_id,
      type: result.resource_type
    });
    
    fs.unlink(file.path, (err) => {
      if (err) console.error("Failed to delete file:", err);
    });
  }  

  const updatedSection = await section.save();
  return updatedSection;
}

export default router;