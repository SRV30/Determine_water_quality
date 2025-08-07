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
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const logs = await WaterLog.find({
      user: req.user._id,
      createdAt: { $gte: start, $lte: end },
    });

    const total = logs.reduce((acc, log) => acc + log.amount, 0);
    res.status(200).json({ logs, total });
  } catch (error) {
    console.error("Error fetching weekly water log:", error);
    res.status(500).json({ error: "Failed to fetch weekly water log" });
  }
};

export const getLastWeekWaterLog = async (req, res) => {
  try {
    const today = new Date();
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - today.getDay());
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfThisWeek);
    endOfLastWeek.setDate(startOfThisWeek.getDate() - 1);
    endOfLastWeek.setHours(23, 59, 59, 999);

    const logs = await WaterLog.find({
      user: req.user._id,
      createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek },
    });

    const total = logs.reduce((acc, log) => acc + log.amount, 0);
    res.status(200).json({ logs, total });
  } catch (error) {
    console.error("Error fetching last week's water log:", error);
    res.status(500).json({ error: "Failed to fetch last week's water log" });
  }
};

export const getMonthlyWaterLog = async (req, res) => {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const logs = await WaterLog.find({
      user: req.user._id,
      createdAt: { $gte: start, $lte: end },
    });

    const total = logs.reduce((acc, log) => acc + log.amount, 0);
    res.status(200).json({ logs, total });
  } catch (error) {
    console.error("Error fetching monthly water log:", error);
    res.status(500).json({ error: "Failed to fetch monthly water log" });
  }
};

export const getLastMonthWaterLog = async (req, res) => {
  try {
    const today = new Date();
    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfLastMonth = new Date(startOfThisMonth);
    endOfLastMonth.setDate(endOfLastMonth.getDate() - 1);
    endOfLastMonth.setHours(23, 59, 59, 999);
    const startOfLastMonth = new Date(
      endOfLastMonth.getFullYear(),
      endOfLastMonth.getMonth(),
      1
    );

    const logs = await WaterLog.find({
      user: req.user._id,
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const total = logs.reduce((acc, log) => acc + log.amount, 0);
    res.status(200).json({ logs, total });
  } catch (error) {
    console.error("Error fetching last month's water log:", error);
    res.status(500).json({ error: "Failed to fetch last month's water log" });
  }
};
