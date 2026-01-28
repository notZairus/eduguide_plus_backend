import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/auth.js";
import topicsRouter from "./routes/topics.js";
import sectionsRouter from "./routes/section.js";

const app = express();

const CLIENT_URL = process.env.CLIENT_URL;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

// routes
app.use("/auth", authRouter);
app.use("/topics", topicsRouter);
app.use("/sections", sectionsRouter);

app.get("/", (req, res) => {
  res.send({
    message: "Hello world",
  });
});

export default app;
