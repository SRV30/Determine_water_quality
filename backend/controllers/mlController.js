import axios from "axios";

export const getPrediction = async (req, res) => {
  try {
    const response = await axios.post("http://127.0.0.1:5000/predict", req.body);
    res.json({ prediction: response.data.prediction });
  } catch (err) {
    console.error("ML server error:", err);
    res.status(500).json({ error: "ML prediction failed" });
  }
};
