import express from "express";
import {
  addWaterLog,
  getTodayWaterLog,
  getWeeklyWaterLog,
  getLastWeekWaterLog,
  getMonthlyWaterLog,
  getLastMonthWaterLog,
} from "../controllers/waterLogController.js";
import auth from "../middleware/auth.js";

const logRouter = express.Router();

logRouter.post("/add", auth, addWaterLog);
logRouter.get("/today", auth, getTodayWaterLog);
logRouter.get("/week", auth, getWeeklyWaterLog);
logRouter.get("/last-week", auth, getLastWeekWaterLog);
logRouter.get("/month", auth, getMonthlyWaterLog);
logRouter.get("/last-month", auth, getLastMonthWaterLog);

export default logRouter;