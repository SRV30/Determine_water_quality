import axios from "axios";

export const getWaterPrediction = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await axios.post(import.meta.env.VITE_ML_URL || "http://localhost:5001/predict", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
