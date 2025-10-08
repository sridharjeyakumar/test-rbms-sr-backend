import express from "express";
import * as deptController from "../controllers/dept.controller.js";
import { deptControllerMiddleware } from "../middlewares/dept.controller.middleware.js";

const router = express.Router();

// Apply DEPT_CONTROLLER middleware to all routes
router.use(deptControllerMiddleware);

// GET routes
router.get("/users", deptController.getAllUsers);
router.get("/users/:userId/jes", deptController.getAllJEsUnderUser);
router.get("/check-phone", deptController.checkPhoneExists);
router.get("/check-email", deptController.checkEmailExists);

// POST routes
router.post("/users", deptController.createUser);
router.post("/jes", deptController.createJE);

// PATCH routes
router.patch("/users/:userId", deptController.updateUser);
router.patch("/jes/:jeId", deptController.updateJE);

// DELETE routes
router.delete("/users/:userId", deptController.deleteUser);
router.delete("/jes/:jeId", deptController.deleteJE);

export default router;
