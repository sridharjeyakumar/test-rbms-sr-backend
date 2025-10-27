import { Router } from "express";
import { generateReport } from "../controllers/drm.controller.js";
import { authenticateToken, DRMorHQMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
// router.use(authenticateToken);

// DRM Report Generation route
// router.get("/generate-report", DRMorHQMiddleware, generateReport);
router.get("/generate-report", generateReport);

export default router;
