import { Router } from "express";
import { createSectionSchema } from "../validators/handbook";
import Section1 from "../models/Section1";

const router = Router();

router.post("/", async (req, res) => {
  const validationResult = createSectionSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const data = validationResult.data;

  await Section1.create({ title: data.title });

  return res.status(201).send({
    message: "successful",
  });
});

export default router;
