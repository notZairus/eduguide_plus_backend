import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/auth.js";
import mobileAuthRouter from "./routes/mobileAuth.js";
import handbookRouter from "./routes/handbooks.js";
import topicsRouter from "./routes/topics.js";
import sectionsRouter from "./routes/sections.js";
import questionsRouter from "./routes/questions.js";
import quizRouter from "./routes/quizzes.js";
import userRouter from "./routes/users.js";
import classroomRouter from "./routes/classrooms.js";

const app = express();

const CLIENT_URL = process.env.CLIENT_URL;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// routes
app.use("/auth", authRouter);
app.use("/mobile-auth", mobileAuthRouter);
app.use("/handbooks", handbookRouter);
app.use("/topics", topicsRouter);
app.use("/sections", sectionsRouter);
app.use("/questions", questionsRouter);
app.use("/quizzes", quizRouter);
app.use("/users", userRouter);
app.use("/classrooms", classroomRouter);

app.get("/", (req, res) => {
  res.send({
    message: "Hello world",
  });
});

export default app;
