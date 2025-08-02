import express from "express";
import { addRelative, getRelatives } from "../controllers/relativeController.js";
import auth from "../middleware/auth.js";

const relativeRouter = express.Router();

// Add a new relative for the logged-in user
relativeRouter.post("/add", auth, addRelative);

// Get all relatives of the logged-in user
relativeRouter.get("/all", auth, getRelatives);

export default relativeRouter;
