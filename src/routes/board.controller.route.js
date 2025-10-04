import express from "express";
import * as boardController from "../controllers/board.controller.js";
import { authenticateToken, boardControllerMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Route to get sanctioned requests within a specific time range
router.get(
    "/sanctioned-requests",
    authenticateToken,
    boardControllerMiddleware,
    boardController.getSanctionedRequests,
);

export default router;
