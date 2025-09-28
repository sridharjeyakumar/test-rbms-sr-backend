import { successResponse } from "../utils/response.js";
import * as notificationService from "../services/notification.service.js";

/**
 * Register FCM token for the authenticated user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const registerToken = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "FCM token is required",
            });
        }

        const result = await notificationService.registerToken(userId, token);

        if (result.success) {
            return successResponse(res, 200, "FCM token registered successfully", {
                userId,
                tokenRegistered: true,
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Failed to register FCM token",
                error: result.error,
            });
        }
    } catch (error) {
        console.error("Error in registerToken controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
