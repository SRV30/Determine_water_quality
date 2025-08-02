import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import Image from "../models/imageModel.js";

const uploadImageController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const result = await uploadImage(req.file); // expects { public_id, secure_url }

    const saved = await Image.create({
      public_id: result.public_id,
      url: result.secure_url,
    });

    res.status(201).json({
      message: "Image uploaded successfully",
      image: {
        publicId: result.public_id,
        url: result.secure_url,
      },
    });
  } catch (error) {
    console.error("Upload Error:", error.message);
    res.status(500).json({ message: `Image upload failed: ${error.message}` });
  }
};

const deleteImageController = async (req, res) => {
  try {
    const { publicId } = req.params;
    const result = await deleteImage(publicId);
    await Image.findOneAndDelete({ public_id: publicId });

    res.status(200).json({ message: "Image deleted", result });
  } catch (error) {
    console.error("Delete Error:", error.message);
    res.status(500).json({ message: `Image delete failed: ${error.message}` });
  }
};

export { uploadImageController, deleteImageController };
