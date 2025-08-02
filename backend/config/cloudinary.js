import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUD_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUD_API_SECRET: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "waterLabels",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

export { cloudinary, storage, deleteImage };