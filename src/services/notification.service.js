import prisma from "../prisma/index.js";
import {
    sendNotificationToMultipleTokens,
    sendNotificationToToken,
} from "../utils/firebase.utils.js";

/**
 * Register FCM token for a user
 * @param {string} userId - The user ID
 * @param {string} token - The FCM token
 * @returns {Promise} - The updated user object
 */
export const registerToken = async (userId, token) => {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { fcm_token: token },
        });
        return { success: true, user: updatedUser };
    } catch (error) {
        console.error("Error registering FCM token:", error);
        return { success: false, error };
    }
};

/**
 * Get FCM tokens for users with a specific role
 * @param {string} role - The role to filter users by
 * @param {string} department - Optional department to filter by
 * @param {string} location - Optional location to filter by
 * @returns {Promise<string[]>} - Array of FCM tokens
 */
export const getTokensByRole = async (role, department, location) => {
    try {
        // Build where clause based on provided filters
        const whereClause = {
            role,
            fcm_token: { not: null },
        };

        // Add department filter if provided
        if (department) {
            whereClause.department = department;
        }

        // Add location filter if provided
        if (location) {
            whereClause.location = location;
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: { fcm_token: true },
        });

        return users.map((user) => user.fcm_token).filter((token) => token);
    } catch (error) {
        console.error("Error getting tokens by role:", error);
        return [];
    }
};

/**
 * Send notification for urgent requests to department controllers
 * @param {object} request - The request object
 * @returns {Promise} - The result of sending the notification
 */
export const notifyDeptControllerForUrgentRequest = async (request) => {
    try {
        // Check if the request is urgent (you need to define this logic)
        const isUrgent = request.corridorType === "Urgent Block"; // Adjust according to your schema

        if (!isUrgent) {
            return { success: true, message: "Request is not urgent, no notification sent" };
        }

        // Get user information to filter department controllers with the same department and location
        const user = await prisma.user.findUnique({
            where: { id: request.userId },
            select: { department: true, location: true },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        // Get tokens for DEPT_CONTROLLER role with matching department and location
        const tokens = await getTokensByRole("DEPT_CONTROLLER", user.department, user.location);

        if (!tokens || tokens.length === 0) {
            return {
                success: false,
                message:
                    "No department controllers with FCM tokens available for this department and location",
            };
        }

        // Send notification to DEPT_CONTROLLER
        const deptControllerResult = await sendNotificationToMultipleTokens(
            tokens,
            {
                title: "Urgent Request Created",
                body: `Urgent request created for ${request.missionBlock} by ${request.selectedDepartment}`,
            },
            {
                requestId: request.id,
                type: "urgent_request",
                createdAt: new Date().toISOString(),
            },
        );

        // Also send notifications to S&T and TRD users if needed
        const departmentUsersResult = await notifyDepartmentUsersForUrgentRequest(request);

        return {
            success: true,
            deptControllerResult,
            departmentUsersResult,
            message: "Notifications sent to department controllers and relevant department users",
        };
    } catch (error) {
        console.error("Error sending notification to department controllers:", error);
        return { success: false, error };
    }
};

/**
 * Send notification for accepted urgent requests to admins
 * @param {object} request - The request object
 * @returns {Promise} - The result of sending the notification
 */
export const notifyAdminsForAcceptedUrgentRequest = async (request) => {
    try {
        // Check if the request is urgent and accepted
        const isUrgent = request.corridorType === "Urgent Block"; // Adjust according to your schema
        const isAccepted = request.managerAcceptance === true;

        if (!isUrgent || !isAccepted) {
            return {
                success: true,
                message: "Request is not urgent or not accepted, no notification sent",
            };
        }

        // Get user information to filter admins with the same department
        const user = await prisma.user.findUnique({
            where: { id: request.userId },
            select: { department: true },
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        // Get tokens for ADMIN role with matching department
        const tokens = await getTokensByRole("ADMIN", user.department);

        if (!tokens || tokens.length === 0) {
            return {
                success: false,
                message: "No admins with FCM tokens available for this department",
            };
        }

        // Send notification
        return await sendNotificationToMultipleTokens(
            tokens,
            {
                title: "Urgent Request Approved",
                body: `Manager approved urgent request for ${request.missionBlock}`,
            },
            {
                requestId: request.id,
                type: "urgent_request_approved",
                createdAt: new Date().toISOString(),
            },
        );
    } catch (error) {
        console.error("Error sending notification to admins:", error);
        return { success: false, error };
    }
};

/**
 * Notify S&T and TRD department users about urgent requests that require their action
 * @param {object} request - The request object
 * @returns {Promise} - The result of sending the notifications
 */
export const notifyDepartmentUsersForUrgentRequest = async (request) => {
    try {
        // Only proceed if this is an urgent request
        if (request.corridorType !== "Urgent Block") {
            return { success: true, message: "Request is not urgent, no notification sent" };
        }

        // Get the name of the user who created the request
        const requestingUser = await prisma.user.findUnique({
            where: { id: request.userId },
            select: { name: true },
        });

        if (!requestingUser) {
            return { success: false, message: "Requesting user not found" };
        }

        const results = [];

        // Check if S&T notification is needed
        if (request.sntDisconnectionRequired === true && request.sntDisconnectionAssignTo) {
            // Get users with S&T department in the specific depot from sntDisconnectionAssignTo
            const sntUsers = await prisma.user.findMany({
                where: {
                    department: "S&T",
                    depot: request.sntDisconnectionAssignTo,
                    fcm_token: { not: null },
                },
                select: { fcm_token: true },
            });

            const sntTokens = sntUsers.map((user) => user.fcm_token).filter((token) => token);

            if (sntTokens.length > 0) {
                const sntResult = await sendNotificationToMultipleTokens(
                    sntTokens,
                    {
                        title: "Urgent Block Request Requires S&T Action",
                        body: `Urgent request from ${requestingUser.name} requires S&T disconnection for ${request.missionBlock}`,
                    },
                    {
                        requestId: request.id,
                        type: "urgent_snt_request",
                        createdAt: new Date().toISOString(),
                    },
                );
                results.push({ department: "S&T", result: sntResult });
            }
        }

        // Check if TRD notification is needed
        if (request.powerBlockRequired === true && request.powerBlockDisconnectionAssignTo) {
            // Get users with TRD department in the specific depot from powerBlockDisconnectionAssignTo
            const trdUsers = await prisma.user.findMany({
                where: {
                    department: "TRD",
                    depot: request.powerBlockDisconnectionAssignTo,
                    fcm_token: { not: null },
                },
                select: { fcm_token: true },
            });

            const trdTokens = trdUsers.map((user) => user.fcm_token).filter((token) => token);

            if (trdTokens.length > 0) {
                const trdResult = await sendNotificationToMultipleTokens(
                    trdTokens,
                    {
                        title: "Urgent Block Request Requires TRD Action",
                        body: `Urgent request from ${requestingUser.name} requires power block for ${request.missionBlock}`,
                    },
                    {
                        requestId: request.id,
                        type: "urgent_trd_request",
                        createdAt: new Date().toISOString(),
                    },
                );
                results.push({ department: "TRD", result: trdResult });
            }
        }

        return {
            success: true,
            results: results,
            message: `Sent notifications to relevant departments: ${results.length > 0 ? results.map((r) => r.department).join(", ") : "none"}`,
        };
    } catch (error) {
        console.error("Error sending notification to department users:", error);
        return { success: false, error };
    }
};

/**
 * Notify all USERs in selectedSection depot when a request is created
 * @param {object} request - The request object
 * @returns {Promise}
 */
export const notifyUsersInSelectedSection = async (request) => {
    try {
        // Dynamically import MajorSectionDepot
        const { MajorSectionDepot } = await import("../data/store.js");
        const depots = MajorSectionDepot[request.selectedSection] || [];
        if (!depots.length)
            return { success: false, message: "No depots found for selectedSection" };

        // Find all USERs whose depot is in the list
        const users = await prisma.user.findMany({
            where: {
                role: "USER",
                depot: { in: depots },
                fcm_token: { not: null },
            },
            select: { fcm_token: true },
        });
        const tokens = users.map((u) => u.fcm_token).filter(Boolean);
        if (!tokens.length)
            return {
                success: false,
                message: "No USERs with FCM tokens in selectedSection depots",
            };

        // Get the name of the user who created the request
        const requestingUser = await prisma.user.findUnique({
            where: { id: request.userId },
            select: { name: true },
        });

        if (!requestingUser) {
            return { success: false, message: "Requesting user not found" };
        }

        return await sendNotificationToMultipleTokens(
            tokens,
            {
                title: `New Request Created in ${request.selectedSection}`,
                body: `Request for ${request.missionBlock} by ${requestingUser.name}, ${request.selectedDepartment}`,
            },
            {
                requestId: request.id,
                type: "new_request_section",
                createdAt: new Date().toISOString(),
            },
        );
    } catch (error) {
        console.error("Error notifying users in selectedSection depot:", error);
        return { success: false, error };
    }
};

/**
 * Notify respective DEPT_CONTROLLERs for S&T/TRD disconnections
 * @param {object} request - The request object
 * @returns {Promise}
 */
export const notifyDeptControllersForDisconnections = async (request) => {
    try {
        const results = [];
        // S&T DEPT_CONTROLLER
        if (request.sntDisconnectionRequired) {
            const sntDeptControllerTokens = await getTokensByRole(
                "DEPT_CONTROLLER",
                "S&T",
                request.location,
            );
            if (sntDeptControllerTokens.length) {
                const sntResult = await sendNotificationToMultipleTokens(
                    sntDeptControllerTokens,
                    {
                        title: "S&T Disconnection Required",
                        body: `Request for ${request.missionBlock} requires S&T disconnection.`,
                    },
                    {
                        requestId: request.id,
                        type: "snt_disconnection",
                        createdAt: new Date().toISOString(),
                    },
                );
                results.push({ department: "S&T", result: sntResult });
            }
        }
        // TRD DEPT_CONTROLLER
        if (request.powerBlockRequired) {
            const trdDeptControllerTokens = await getTokensByRole(
                "DEPT_CONTROLLER",
                "TRD",
                request.location,
            );
            if (trdDeptControllerTokens.length) {
                const trdResult = await sendNotificationToMultipleTokens(
                    trdDeptControllerTokens,
                    {
                        title: "TRD Disconnection Required",
                        body: `Request for ${request.missionBlock} requires TRD disconnection.`,
                    },
                    {
                        requestId: request.id,
                        type: "trd_disconnection",
                        createdAt: new Date().toISOString(),
                    },
                );
                results.push({ department: "TRD", result: trdResult });
            }
        }

        // Also notify the DEPT_CONTROLLER of the request creator's department (except S&T/TRD, e.g., ENGG)
        if (request.selectedDepartment && !["S&T", "TRD"].includes(request.selectedDepartment)) {
            const creatorDeptControllerTokens = await getTokensByRole(
                "DEPT_CONTROLLER",
                request.selectedDepartment,
                request.location,
            );
            if (creatorDeptControllerTokens.length) {
                const creatorResult = await sendNotificationToMultipleTokens(
                    creatorDeptControllerTokens,
                    {
                        title: `${request.selectedDepartment} Request Created`,
                        body: `Request for ${request.missionBlock} created by ${request.selectedDepartment}.`,
                    },
                    {
                        requestId: request.id,
                        type: "creator_dept_request",
                        createdAt: new Date().toISOString(),
                    },
                );
                results.push({ department: request.selectedDepartment, result: creatorResult });
            }
        }
        return { success: true, results };
    } catch (error) {
        console.error("Error notifying DEPT_CONTROLLERs for disconnections:", error);
        return { success: false, error };
    }
};

export default {
    registerToken,
    getTokensByRole,
    notifyDeptControllerForUrgentRequest,
    notifyAdminsForAcceptedUrgentRequest,
    notifyDepartmentUsersForUrgentRequest,
    notifyUsersInSelectedSection,
    notifyDeptControllersForDisconnections,
};
