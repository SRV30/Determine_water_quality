import WaterLog from "../models/WaterLog.js";

export const addWaterLog = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid or missing amount" });
    }

    const waterLog = new WaterLog({
      user: req.user._id,
      amount,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    await waterLog.save();
    res.status(201).json({ message: "Water log added", waterLog });
  } catch (error) {
    console.error("Error adding water log:", error);
    res.status(500).json({ error: "Failed to add water log" });
  }
};

export const getTodayWaterLog = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const logs = await WaterLog.find({
      user: req.user._id,
      createdAt: { $gte: start, $lte: end },
    });

    const total = logs.reduce((acc, log) => acc + log.amount, 0);
    res.status(200).json({ logs, total });
  } catch (error) {
    console.error("Error fetching today's water log:", error);
    res.status(500).json({ error: "Failed to fetch water log" });
  }
};

export const getWeeklyWaterLog = async (req, res) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const logs = await WaterLog.find({
    user: req.user._id,
    time: { $gte: start, $lte: end },
  });

  const total = logs.reduce((acc, log) => acc + log.amount, 0);
  res.status(200).json({ logs, total });
};

export const getMonthlyWaterLog = async (req, res) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const logs = await WaterLog.find({
    user: req.user._id,
    time: { $gte: start, $lte: end },
  });

  const total = logs.reduce((acc, log) => acc + log.amount, 0);
  res.status(200).json({ logs, total });
};
