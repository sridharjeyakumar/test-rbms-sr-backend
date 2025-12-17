//This is a Barrel File that exports all the routes in the routes folder

import express from "express";
import authRoute from "./auth.route.js";
import userRequestRoute from "./user.request.route.js";
import officerRoute from "./officer.route.js";
import openRoutes from "./open.route.js";
import drmRoute from "./drm.route.js";
import hqRoute from "./hq.route.js";
import userGrRoute from "./user.gr.route.js";
import notificationRoute from "./notification.route.js";
import boardControllerRoute from "./board.controller.route.js";
import deptControllerRoute from "./dept.controller.route.js";
import trafficControllerRoute from "./traffic.controller.route.js";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/user-request", userRequestRoute);
router.use("/officer", officerRoute);
router.use("/open", openRoutes);
router.use("/drm", drmRoute);
router.use("/hq", hqRoute);
router.use("/user-gr", userGrRoute);
router.use("/notifications", notificationRoute);
router.use("/board-controller", boardControllerRoute);
router.use("/dept-controller", deptControllerRoute);
router.use("/traffic-controller", trafficControllerRoute);

export default router;
