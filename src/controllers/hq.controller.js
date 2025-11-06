// src/controllers/drm.controller.js
import { generateHqReport } from "../services/hq.service.js";
import { handleError, successResponse } from "../utils/response.js";

// Generate DRM Report
export const generateReport = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            location,
            department,
            blockType,
            majorSections,
            globalWorkType,
            globalActivity,
            globalTimeSlot,
        } = req.query;
        // Parse query parameters
        const locationFilter = location ? location.split(",") : [];
        const majorSectionsFilter = majorSections ? majorSections.split(",") : [];
        const departmentFilter = department ? department.split(",") : [];
        const blockTypeFilter = blockType ? blockType.split(",") : [];
        const globalWorkTypeFilter = globalWorkType || "ALL";
        const globalActivityFilter = globalActivity || "ALL";
        const globalTimeSlotFilter = globalTimeSlot || "ALL";
        // Convert date strings to Date objects
        // const parsedStartDate = startDate ? new Date(startDate) : null;
        // const parsedEndDate = endDate ? new Date(endDate) : null;
        // console.log(parsedStartDate,"322",endDate,"++" ,parsedEndDate);
        // Get the report data from the service
        const result = await generateHqReport(
            startDate,
            endDate,
            locationFilter,
            departmentFilter,
            blockTypeFilter,
            majorSectionsFilter,
            globalWorkTypeFilter,
            globalActivityFilter,
            globalTimeSlotFilter,
        );

        return successResponse(res, 200, "Report generated successfully", result);
    } catch (error) {
        handleError(error, res);
    }
};
