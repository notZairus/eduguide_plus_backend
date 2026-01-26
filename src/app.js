import express from "express";
import authRouter from "./routes/auth.js";
import sectionRouter from "./routes/topics.js";
import cookieParser from "cookie-parser";
import cors from "cors";

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
app.use("/topics", sectionRouter);

app.get("/", (req, res) => {
  res.send({
    message: "Hello world",
  });
});

export default app;
