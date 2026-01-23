import mongoose from "mongoose";

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) return;

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    process.exit(1);
  }
};

export default connectDB;
