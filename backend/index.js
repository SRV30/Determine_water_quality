import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cloudinary from "cloudinary";

dotenv.config();

cloudinary.config({
cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "https://smartcare-xi.vercel.app",
  "http://localhost:5173",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import uploadRoutes from "./routes/uploadRoutes.js";
import userRouter from "./routes/userRoutes.js";
import relativeRouter from "./routes/relativeRoutes.js";
import userDetailsRouter from "./routes/healthInfoRoutes.js";
import logRouter from "./routes/waterLogRoutes.js";

app.use("/api/image", uploadRoutes);
app.use("/api/user", userRouter);
app.use("/api/relative", relativeRouter);
app.use("/api/details", userDetailsRouter);
app.use("/api/water-log", logRouter);


app.get("/", (req, res) => {
  res.send("Water Quality Backend is Running 🌊");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });
