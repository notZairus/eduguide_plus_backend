import express from "express";
// import authRouter from "./routes/auth";
// import handbookRouter from "./routes/handbook";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// routes
// app.use("/auth", authRouter);
// app.use("/handbook", handbookRouter);

app.get("/", (req, res) => {
  res.send({
    message: "Hello world",
  });
});

export default app;
