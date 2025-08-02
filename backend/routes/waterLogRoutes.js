import express from "express";
import {
  addWaterLog,
  getTodayWaterLog,
  getWeeklyWaterLog,
  getMonthlyWaterLog,
} from "../controllers/waterLogController.js";
import auth from "../middleware/auth.js";

const logRouter = express.Router();

logRouter.post("/add", auth, addWaterLog);
logRouter.get("/today", auth, getTodayWaterLog);
logRouter.get("/week", auth, getWeeklyWaterLog);
logRouter.get("/month", auth, getMonthlyWaterLog);

export default logRouter;
