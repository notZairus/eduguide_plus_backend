import { Router } from "express";

import { getAuthenticatedId } from "../lib/helpers.js";
import Classroom from "../models/Classroom.js";
import MobileUser from "../models/MobileUser.js";
import {
  createClassroomSchema,
  joinClassroomParamsSchema,
  updateClassroomSchema,
} from "../validators/classroom.validator.js";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

const router = Router();

router.get("/", async (req, res) => {
  const userId = getAuthenticatedId(req, res);

  if (!userId) return;

  const user = await MobileUser.findById(userId);

  if (!user) {
    return res.status(404).send({
      message: "Mobile user not found",
    });
  }

  let classrooms = [];

  if (user.role === "instructor") {
    classrooms = await Classroom.find({
      owner_id: user._id,
      is_active: true,
    })
      .sort({ createdAt: -1 })
      .lean();
  } else if (user.role === "student") {
    classrooms = await Classroom.find({
      is_active: true,
      members: {
        $elemMatch: {
          user_id: user._id,
          role: "student",
        },
      },
    })
      .sort({ createdAt: -1 })
      .lean();
  } else {
    return res.status(403).send({
      message: "Only instructors and students can view classrooms",
    });
  }

  return res.status(200).send({
    classrooms,
  });
});

function generateClassroomCode() {
  let code = "";

  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }

  return code;
}

async function generateUniqueClassroomCode() {
  for (let i = 0; i < 5; i++) {
    const code = generateClassroomCode();
    const existingClassroom = await Classroom.exists({ code });

    if (!existingClassroom) return code;
  }

  throw new Error("Unable to generate a unique classroom code");
}

router.post("/", async (req, res) => {
  const userId = getAuthenticatedId(req, res);

  if (!userId) return;

  const validationResult = createClassroomSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const user = await MobileUser.findById(userId);

  if (!user) {
    return res.status(404).send({
      message: "Mobile user not found",
    });
  }

  if (user.role !== "instructor") {
    return res.status(403).send({
      message: "Only instructors can create classrooms",
    });
  }

  const code = await generateUniqueClassroomCode();

  const classroom = await Classroom.create({
    name: validationResult.data.name,
    description: validationResult.data.description,
    code,
    owner_id: user._id,
    handbook_id: user.handbook_id,
    members: [{ user_id: user._id, role: "instructor" }],
  });

  return res.status(201).send({
    message: "Classroom created successfully",
    classroom,
  });
});

router.post("/:code/join", async (req, res) => {
  const userId = getAuthenticatedId(req, res);

  if (!userId) return;

  const paramsValidationResult = joinClassroomParamsSchema.safeParse(
    req.params,
  );

  if (!paramsValidationResult.success) {
    return res.status(400).send({
      errors: paramsValidationResult.error.format(),
    });
  }

  const user = await MobileUser.findById(userId);

  if (!user) {
    return res.status(404).send({
      message: "Mobile user not found",
    });
  }

  if (user.role !== "student") {
    return res.status(403).send({
      message: "Only students can join classrooms",
    });
  }

  const classroom = await Classroom.findOne({
    code: paramsValidationResult.data.code,
    is_active: true,
  });

  if (!classroom) {
    return res.status(404).send({
      message: "Classroom not found",
    });
  }

  if (classroom.handbook_id.toString() !== user.handbook_id.toString()) {
    return res.status(403).send({
      message: "You cannot join a classroom from a different handbook",
    });
  }

  const isAlreadyMember = classroom.members.some(
    (member) => member.user_id.toString() === user._id.toString(),
  );

  if (isAlreadyMember) {
    return res.status(409).send({
      message: "You are already a member of this classroom",
    });
  }

  classroom.members.push({
    user_id: user._id,
    role: "student",
  });

  await classroom.save();

  return res.status(200).send({
    message: "Joined classroom successfully",
    classroom,
  });
});

router.post("/:classroomId/leave", async (req, res) => {
  const userId = getAuthenticatedId(req, res);

  if (!userId) return;

  const user = await MobileUser.findById(userId);

  if (!user) {
    return res.status(404).send({
      message: "Mobile user not found",
    });
  }

  if (user.role !== "student") {
    return res.status(403).send({
      message: "Only students can leave classrooms",
    });
  }

  const classroom = await Classroom.findOne({
    _id: req.params.classroomId,
    is_active: true,
  });

  if (!classroom) {
    return res.status(404).send({
      message: "Classroom not found",
    });
  }

  const memberIndex = classroom.members.findIndex(
    (member) =>
      member.user_id.toString() === user._id.toString() &&
      member.role === "student",
  );

  if (memberIndex === -1) {
    return res.status(409).send({
      message: "You are not a member of this classroom",
    });
  }

  classroom.members.splice(memberIndex, 1);
  await classroom.save();

  return res.status(200).send({
    message: "Left classroom successfully",
  });
});

router.get("/:classroomId/members", async (req, res) => {
  const userId = getAuthenticatedId(req, res);

  if (!userId) return;

  const user = await MobileUser.findById(userId);

  if (!user) {
    return res.status(404).send({
      message: "Mobile user not found",
    });
  }

  if (user.role !== "instructor") {
    return res.status(403).send({
      message: "Only instructors can view classroom members",
    });
  }

  const classroom = await Classroom.findOne({
    _id: req.params.classroomId,
    owner_id: user._id,
    is_active: true,
  })
    .populate("members.user_id", "first_name middle_name last_name email role")
    .lean();

  if (!classroom) {
    return res.status(404).send({
      message: "Classroom not found",
    });
  }

  return res.status(200).send({
    classroom,
  });
});

router.patch("/:classroomId", async (req, res) => {
  const userId = getAuthenticatedId(req, res);

  if (!userId) return;

  const user = await MobileUser.findById(userId);

  if (!user) {
    return res.status(404).send({
      message: "Mobile user not found",
    });
  }

  if (user.role !== "instructor") {
    return res.status(403).send({
      message: "Only instructors can update classrooms",
    });
  }

  const validationResult = updateClassroomSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).send({
      errors: validationResult.error.format(),
    });
  }

  const classroom = await Classroom.findOne({
    _id: req.params.classroomId,
    owner_id: user._id,
    is_active: true,
  });

  if (!classroom) {
    return res.status(404).send({
      message: "Classroom not found",
    });
  }

  if (typeof validationResult.data.name === "string") {
    classroom.name = validationResult.data.name;
  }

  if (typeof validationResult.data.description === "string") {
    classroom.description = validationResult.data.description;
  }

  await classroom.save();

  return res.status(200).send({
    message: "Classroom updated successfully",
    classroom,
  });
});

router.delete("/:classroomId", async (req, res) => {
  const userId = getAuthenticatedId(req, res);

  if (!userId) return;

  const user = await MobileUser.findById(userId);

  if (!user) {
    return res.status(404).send({
      message: "Mobile user not found",
    });
  }

  if (user.role !== "instructor") {
    return res.status(403).send({
      message: "Only instructors can delete classrooms",
    });
  }

  const classroom = await Classroom.findOne({
    _id: req.params.classroomId,
    owner_id: user._id,
    is_active: true,
  });

  if (!classroom) {
    return res.status(404).send({
      message: "Classroom not found",
    });
  }

  classroom.is_active = false;
  await classroom.save();

  return res.status(200).send({
    message: "Classroom deleted successfully",
  });
});

export default router;
