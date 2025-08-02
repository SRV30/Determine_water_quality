import Relative from "../models/relativeModel.js";

// Add a relative
export const addRelative = async (req, res) => {
  try {
    const { name, age, gender, isPregnant, relation } = req.body;

    const relative = await Relative.create({
      user: req.user._id,
      name,
      age,
      gender,
      isPregnant,
      relation,
    });

    res.status(201).json({ success: true, relative });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all relatives of user
export const getRelatives = async (req, res) => {
  try {
    const relatives = await Relative.find({ user: req.user._id });
    res.status(200).json({ success: true, relatives });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
