import { Router } from "express";
import { createTopicSchema } from "../validators/handbook.validator.js";
import Topic from "../models/Topic.js";
import { getAuthenticatedId } from "../lib/helpers.js";
import Handbook from "../models/Handbook.js";

const router = Router();

router.get("/", async (req, res) => {
  const userId = getAuthenticatedId(req);
  const handbook = await Handbook.findOne({ user_id: userId }).populate({
    path: "topics",
    populate: { path: "sections" }
  });

  const topics = handbook.topics;

  if (!topics) return res.json({
    topics: []
  });

  for (let i = 0; i < topics.length; i++) {
    const sections = topics[i].sections;
    if (sections.length > 0) {
      const sortedSections = sections.sort((a, b) => a.order - b.order);
      topics[i].sections = sortedSections; 
    }
  }

  return res.status(200).json({
    topics: topics.sort((a, b) => a.order - b.order),
  })
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findOne({
      _id: id,
    }).populate("sections");

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    if (topic.sections?.length) {
      topic.sections.sort((a, b) => a.order - b.order);
    }

    return res.status(200).json({ topic });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const validationResult = createTopicSchema.safeParse(req.body);

  const userId = getAuthenticatedId(req);
  const handbook = await Handbook.findOne({ user_id: userId });

  if (!handbook) return res.status(404).json({ message: "Handbook not found" });

  if (!validationResult.success) {
    return res.status(400).json({ errors: validationResult.error.errors });
  }

  const data = validationResult.data;

  const newTopic = await Topic.create({ 
    title: data.title, 
    order: handbook.topics.length + 1, 
    user_id: userId 
  });

  handbook.topics.push(newTopic._id);

  await handbook.save();

  return res.status(201).send({
    topic: newTopic
  });
});

router.patch("/:id", async (req, res) => {
  const topicId = req.params.id;
  const { body } = req;

  const topic = await Topic.findById(topicId);

  if (!topic) return res.sendStatus(404);

  Object.keys(body).forEach(key => {
    topic[key] = body[key];
  });

  await topic.save();

  return res.status(200).send({
    topic
  });
});

router.delete("/:id", async (req, res) => {
  const topicId = req.params.id;
  await Topic.findOneAndDelete({ _id: topicId });
  return res.sendStatus(200);
});



export default router;
