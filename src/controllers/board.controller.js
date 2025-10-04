import * as boardControllerService from "../services/board.controller.service.js";
import { successResponse } from "../utils/response.js";

export const getSanctionedRequests = async (req, res) => {
    try {
        // Get hours from query parameters, default to 8 hours
        const hours = parseInt(req.query.hours) || 8;

        // Validate hours parameter
        if (![8, 16, 24].includes(hours)) {
            return res.status(400).json({
                success: false,
                message: "Invalid hours value. Must be 8, 16, or 24.",
            });
        }

        const result = await boardControllerService.getSanctionedRequestsByTimeRange(hours);

        return successResponse(
            res,
            200,
            `Successfully fetched sanctioned requests for next ${hours} hours`,
            result,
        );
    } catch (error) {
        console.error("Error in getSanctionedRequests controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch sanctioned requests",
            error: error.message,
        });
    }
};
