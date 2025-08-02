import React, { useState } from "react";

import Tesseract from "tesseract.js";
import { getWaterPrediction } from "../api/mlModelAPI";

const WaterPrediction = () => {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const extractDataAndPredict = async () => {
    if (!image) return alert("Please upload an image");

    setLoading(true);
    try {
      // Step 1: OCR
      const result = await Tesseract.recognize(image, "eng");
      const text = result.data.text;
      console.log("OCR Text:", text);

      // Step 2: Parse minerals using regex
      const data = {
        ph: parseFloat(text.match(/ph[:=]?\s?([\d.]+)/i)?.[1]) || 7.0,
        Hardness: parseFloat(text.match(/hardness[:=]?\s?([\d.]+)/i)?.[1]) || 150,
        Solids: parseFloat(text.match(/solids[:=]?\s?([\d.]+)/i)?.[1]) || 10000,
        Chloramines: parseFloat(text.match(/chloramines[:=]?\s?([\d.]+)/i)?.[1]) || 6,
        Sulfate: parseFloat(text.match(/sulfate[:=]?\s?([\d.]+)/i)?.[1]) || 250,
        Conductivity: parseFloat(text.match(/conductivity[:=]?\s?([\d.]+)/i)?.[1]) || 400,
        Organic_carbon: parseFloat(text.match(/organic\s+carbon[:=]?\s?([\d.]+)/i)?.[1]) || 10,
        Trihalomethanes: parseFloat(text.match(/trihalomethanes[:=]?\s?([\d.]+)/i)?.[1]) || 60,
        Turbidity: parseFloat(text.match(/turbidity[:=]?\s?([\d.]+)/i)?.[1]) || 3,
      };

      console.log("Parsed Data:", data);

      // Step 3: Call backend ML API
      const res = await getWaterPrediction(data);
      setPrediction(res.prediction);
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to extract or predict");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Upload Water Label Image</h1>

      <input type="file" accept="image/*" onChange={handleImageChange} />
      <button
        onClick={extractDataAndPredict}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        disabled={loading}
      >
        {loading ? "Predicting..." : "Predict Water Quality"}
      </button>

      {prediction !== null && (
        <p className="mt-4 text-lg">
          Result:{" "}
          <span className={prediction ? "text-green-600" : "text-red-600"}>
            {prediction ? "Safe to drink" : "Not safe to drink"}
          </span>
        </p>
      )}
    </div>
  );
};

export default WaterPrediction;
