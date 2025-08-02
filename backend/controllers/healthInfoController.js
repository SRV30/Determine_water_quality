import HealthInfo from "../models/healthInfoModel.js";

export const addHealthInfo = async (req, res) => {
  try {
    const data = { ...req.body, user: req.user._id };
    const healthInfo = await HealthInfo.create(data);
    res.status(201).json({ success: true, healthInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHealthInfo = async (req, res) => {
  try {
    const healthInfo = await HealthInfo.findOne({ user: req.user._id });
    if (!healthInfo) {
      return res.status(404).json({ success: false, message: "No health data found" });
    }
    res.json({ success: true, healthInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHealthInfo = async (req, res) => {
  try {
    const healthInfo = await HealthInfo.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!healthInfo) {
      return res.status(404).json({ success: false, message: "No health data found to update" });
    }
    res.json({ success: true, healthInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
