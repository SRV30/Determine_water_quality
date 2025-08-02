import express from "express";
import upload from "../middleware/multer.js";
import {
  uploadImageController,
  deleteImageController,
} from "../controllers/imageController.js";

const uploadRouter = express.Router();

uploadRouter.post("/upload", upload.single("image"), uploadImageController);
uploadRouter.delete("/delete/:publicId", deleteImageController);

export default uploadRouter;
