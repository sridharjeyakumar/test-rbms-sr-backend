import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import * as notificationController from "../controllers/notification.controller.js";

const router = express.Router();

// Route to register FCM token
router.post("/register-token", authenticateToken, notificationController.registerToken);

export default router;
