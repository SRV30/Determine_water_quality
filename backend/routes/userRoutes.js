import express from "express";
import { signup, login, getProfile } from "../controllers/userController.js";
import auth from "../middleware/auth.js";

const userRouter = express.Router();

// Signup route
userRouter.post("/signup", signup);

// Login route
userRouter.post("/login", login);

// Get logged-in user profile
userRouter.get("/me", auth, getProfile);



export default userRouter;
