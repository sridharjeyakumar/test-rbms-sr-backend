import express from "express";
import * as trafficController from "../controllers/traffic.controller.js";
import { trafficontrollerMiddleware } from "../middlewares/traffic.controller.middleware.js";

const router = express.Router();

// Apply DEPT_CONTROLLER middleware to all routes
router.use(trafficontrollerMiddleware);

// GET routes
router.get("/users", trafficController.getAllUsers);
router.patch("/users/:userId", trafficController.updateUser);
router.get("/check-phone", trafficController.checkPhoneExists);
router.get("/check-email", trafficController.checkEmailExists);
router.delete("/users/:userId", trafficController.deleteUser);
router.post("/users", trafficController.createUser);

// router.get("/users/:userId/jes", deptController.getAllJEsUnderUser);
// router.get("/check-phone", deptController.checkPhoneExists);
// router.get("/check-email", deptController.checkEmailExists);

// // POST routes
// router.post("/users", deptController.createUser);
// router.post("/jes", deptController.createJE);

// // PATCH routes
// router.patch("/users/:userId", deptController.updateUser);
// router.patch("/jes/:jeId", deptController.updateJE);

// // DELETE routes
// router.delete("/users/:userId", deptController.deleteUser);
// router.delete("/jes/:jeId", deptController.deleteJE);

export default router;
