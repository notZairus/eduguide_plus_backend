import { Router } from "express";
import { createTopicSchema } from "../validators/handbook.js";
import Topic from "../models/Topic.js";

const router = Router();

router.get("/", async (req, res) => {
  const topics = await Topic.find()
    .populate("sections")
    .sort({ order: 1 });

  if (!topics) return res.json({
    topics: []
  });

  return res.status(200).json({
    topics: topics.sort((a, b) => a.order - b.order),
  })
})

router.post("/", async (req, res) => {
  const validationResult = createTopicSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const data = validationResult.data;

  const topics = await Topic.find();

  const newTopic = await Topic.create({ title: data.title, order: topics.length + 1 });

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
})

router.delete("/:id", async (req, res) => {
  const topicId = req.params.id;
  await Topic.findOneAndDelete({ _id: topicId });
  return res.sendStatus(200);
})



export default router;
