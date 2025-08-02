import express from "express";
import {
  addHealthInfo,
  getHealthInfo,
  updateHealthInfo,
} from "../controllers/healthInfoController.js";
import auth from "../middleware/auth.js";

const userDetailsRouter = express.Router();

userDetailsRouter.post("/health", auth, addHealthInfo);
userDetailsRouter.get("/health", auth, getHealthInfo);
userDetailsRouter.put("/health", auth, updateHealthInfo);

export default userDetailsRouter;
