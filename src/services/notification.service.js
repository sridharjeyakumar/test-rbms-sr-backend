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
 * @returns {Promise<string[]>} - Array of FCM tokens
 */
export const getTokensByRole = async (role) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                role,
                fcm_token: { not: null },
            },
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

        // Get tokens for DEPT_CONTROLLER role
        const tokens = await getTokensByRole("DEPT_CONTROLLER");

        if (!tokens || tokens.length === 0) {
            return {
                success: false,
                message: "No department controllers with FCM tokens available",
            };
        }

        // Send notification
        return await sendNotificationToMultipleTokens(
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

        // Get tokens for ADMIN role
        const tokens = await getTokensByRole("ADMIN");

        if (!tokens || tokens.length === 0) {
            return { success: false, message: "No admins with FCM tokens available" };
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

export default {
    registerToken,
    getTokensByRole,
    notifyDeptControllerForUrgentRequest,
    notifyAdminsForAcceptedUrgentRequest,
};
