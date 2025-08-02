import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadImage = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("No image buffer provided for upload.");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "waterquality",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

const deleteImage = async (public_id) => {
  if (!public_id) throw new Error("Public ID is required");

  const result = await cloudinary.uploader.destroy(public_id);
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Failed to delete image from Cloudinary.");
  }
  return result;
};

export { uploadImage, deleteImage };
