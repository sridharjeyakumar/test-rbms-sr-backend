import express from "express";
import * as requestController from "../controllers/user.request.controller.js";
import {
    adminMiddleware,
    authenticateToken,
    managerMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.put("/accept/:id", authenticateToken, requestController.userRequestRemarkAccept);
router.put("/reject/:id", authenticateToken, requestController.userRequestRemarkReject);
router.get("/manager-cug", authenticateToken, requestController.getManagerCugRequests);
// User routes
router.post("/", authenticateToken, requestController.createRequest);
router.get("/user", authenticateToken, requestController.getUserRequests);
router.get("/user-data", authenticateToken, requestController.getUserRequestsData);
router.get("/manager-data", authenticateToken, requestController.getManagerData);
router.post("/updatedStatus", authenticateToken, requestController.updatedSatus);
router.post("/userResponse", authenticateToken, requestController.userResponse);
router.post("/updateOptimizeTimes", authenticateToken, requestController.updateOptimizeTimes);
router.post("/editRequest", authenticateToken, requestController.editRequest);

router.post("/updateSanctionStatus", authenticateToken, requestController.updateSanctionStatus);
router.post("/updateDraftStatus", authenticateToken, requestController.updateDraftStatus);
router.delete(
    "/delet-optimiseData/:id",
    authenticateToken,
    requestController.deleteOptimizeDataRequest,
);

router.get(
    "/manager/manager-optimise-status",
    authenticateToken,
    requestController.getManagerRequestData,
);
router.get("/:id", authenticateToken, requestController.getRequest);
router.put("/:id", authenticateToken, requestController.updateRequest);
router.delete("/:id", authenticateToken, requestController.deleteRequest);
// Manager routes
router.get(
    "/manager/requests",
    authenticateToken,
    managerMiddleware,
    requestController.getManagerRequests,
);
router.put(
    "/:id/status",
    authenticateToken,
    managerMiddleware,
    requestController.updateRequestStatus,
);

// Get other requests
router.get("/other/:selectedDepo", authenticateToken, requestController.getOtherRequests);

// Get summary requests for a user's section (excluding the user's own requests)
router.get(
    "/summary-requests/:selectedSection",
    authenticateToken,
    requestController.getSectionSummaryRequests,
);

// Update other request
router.put("/other/:id", authenticateToken, requestController.updateOtherRequest);

// Get all requests from manager's users
router.get(
    "/manager/users-requests",
    authenticateToken,
    managerMiddleware,
    requestController.getManagerUsersRequests,
);

router.get(
    "/admin/users-requests",
    authenticateToken,
    adminMiddleware,
    requestController.getAdminUsersRequests,
);

router.put(
    "/manager/accept/:id",
    authenticateToken,
    managerMiddleware,
    requestController.acceptRequestByManager,
);

router.put(
    "/admin/accept/:id",
    authenticateToken,
    adminMiddleware,
    requestController.acceptRequestByAdmin,
);
router.put(
    "/admin/approve-all-pending",
    authenticateToken,
    adminMiddleware,
    requestController.approveAllPendingRequests,
);

// New route for editing user request time fields
router.put(
    "/manager/edit/:id",
    authenticateToken,
    managerMiddleware,
    requestController.editUserRequest,
);

router.post(
    "/admin/save-optimized-requests",
    authenticateToken,
    adminMiddleware,
    requestController.saveOptimizedRequests,
);

router.post(
    "/admin/save-optimized-requests-combined",
    authenticateToken,
    adminMiddleware,
    requestController.saveOptimizedRequestsCombined,
);

router.put(
    "/admin/save-optimized-requests-status",
    authenticateToken,
    adminMiddleware,
    requestController.saveOptimizedRequestsStatus,
);

router.get(
    "/admin/approved",
    authenticateToken,
    adminMiddleware,
    requestController.getUsersByAdminId,
);
router.get(
    "/admin/optimized",
    authenticateToken,
    adminMiddleware,
    requestController.getOptimizeData,
);
router.put(
    "/manager/batch-accept",
    authenticateToken,
    managerMiddleware,
    requestController.batchAcceptRequests,
);
export default router;
