import * as boardControllerService from "../services/board.controller.service.js";
import { successResponse } from "../utils/response.js";

export const getSanctionedRequests = async (req, res) => {
    try {
        // Get hours from query parameters, default to 8 hours
        const hours = parseInt(req.query.hours) || 8;

        // Parse sections from query parameters if present
        let sections = req.query.sections;

        // Try to parse as JSON if it's a string
        if (sections && !Array.isArray(sections)) {
            try {
                // Check if it's a JSON string array
                if (
                    typeof sections === "string" &&
                    sections.startsWith("[") &&
                    sections.endsWith("]")
                ) {
                    sections = JSON.parse(sections);
                } else if (typeof sections === "string" && sections.includes(",")) {
                    // If it's a comma-separated string, split it into an array
                    sections = sections
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                } else {
                    // If it's just a single string value, make it an array
                    sections = [sections];
                }
            } catch (e) {
                console.error("Error parsing sections:", e);
                // If parsing fails, check if it's a comma-separated string
                if (typeof sections === "string" && sections.includes(",")) {
                    sections = sections
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                } else {
                    // Otherwise treat as a single string
                    sections = [sections];
                }
            }
        }
        // Validate hours parameter
        if (![8, 16, 24].includes(hours)) {
            return res.status(400).json({
                success: false,
                message: "Invalid hours value. Must be 8, 16, or 24.",
            });
        }

        const result = await boardControllerService.getSanctionedRequestsByTimeRange(
            hours,
            sections,
        );

        // Build response message with filter details
        let responseMessage = `Successfully fetched sanctioned requests for next ${hours} hours`;

        // Add section info to response message if available
        if (sections && sections.length > 0) {
            const sectionsForDisplay = Array.isArray(sections)
                ? sections.join(", ")
                : sections.toString();
            responseMessage += ` for sections: ${sectionsForDisplay}`;
        }

        return successResponse(res, 200, responseMessage, result);
    } catch (error) {
        console.error("Error in getSanctionedRequests controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch sanctioned requests",
            error: error.message,
        });
    }
};
