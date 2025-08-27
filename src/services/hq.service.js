// // src/services/drm.service.js
// import prisma from "../prisma/index.js";

// // Parse date from DD/MM/YY format and convert to ISO format with correct timezone
// function formatDateForQuery(dateStr) {
//     if (!dateStr) return null;

//     const [day, month, year] = dateStr.split("/");
//     // Convert YY to YYYY
//     const fullYear = `20${year}`;

//     // Format as YYYY-MM-DDT18:30:00.000Z
//     return `${fullYear}-${month}-${day}T18:30:00.000Z`;
// }

// export const generateHqReport = async (
//     startDate,
//     endDate,
//     location,
//     departments,
//     blockTypes,
//     majorSections,
// ) => {
//     const whereClause = {};
//     const filters = [];

//     // 📅 Date filter
//     if (startDate && endDate) {
//         const formattedStartDate = formatDateForQuery(startDate);
//         const formattedEndDate = formatDateForQuery(endDate);
//         if (formattedStartDate && formattedEndDate) {
//             filters.push({
//                 date: {
//                     gte: formattedStartDate,
//                     lte: formattedEndDate,
//                 },
//             });
//         }
//     }

//     // 🏢 Department filter
//     if (departments && departments.length > 0) {
//         const mappedDepartments = departments.map((dept) => {
//             if (dept === "Engineering") return "ENGG";
//             if (dept === "ST") return "S&T";
//             if (dept === "TRD") return "TRD";
//             return dept;
//         });

//         filters.push({
//             selectedDepartment: {
//                 in: mappedDepartments,
//             },
//         });
//     }

//     // 🚧 Block type filter
//     if (
//         blockTypes &&
//         blockTypes.length > 0 &&
//         !(blockTypes.length === 1 && blockTypes[0] === "All")
//     ) {
//         const mappedBlockTypes = blockTypes.map((blockType) => {
//             if (blockType === "Non-corridor") return "Outside Corridor";
//             if (blockType === "Emergency") return "Urgent Block";
//             if (blockType === "Corridor") return "Corridor";
//             if (blockType === "Mega") return "Mega";
//             return blockType;
//         });

//         filters.push({
//             corridorType: {
//                 in: mappedBlockTypes,
//             },
//         });
//     }

//     // 🧭 Major section filter
//     if (
//         majorSections &&
//         majorSections.length > 0 &&
//         !(majorSections.length === 1 && majorSections[0] === "All")
//     ) {
//         filters.push({
//             selectedSection: {
//                 in: majorSections,
//             },
//         });
//     }

//     // Combine all filters
//     whereClause.AND = filters;

//     console.log("Applied filters:", JSON.stringify(whereClause, null, 2));

//     // 📊 Summary data - update the query to include required fields
//     const requestDetails = await prisma.request.findMany({
//         where: whereClause,
//         select: {
//             id: true,
//             selectedDepartment: true,
//             corridorType: true,
//             demandTimeFrom: true,
//             demandTimeTo: true,
//             status: true,
//             sanctionedTimeFrom: true,
//             sanctionedTimeTo: true,
//             AvailedTimeFrom: true,
//             AvailedTimeTo: true,
//             isSanctioned: true,
//             grantedFromTime: true,
//             grantedToTime: true,
//         },
//     });

//     // 📅 Today's date for upcoming blocks
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const whereClauseNew = {
//         AND: [...filters],
//     };

//     // 📋 Detailed report - update the query to include required fields
//     const requestDetailsForReport = await prisma.request.findMany({
//         where: whereClauseNew,
//         orderBy: {
//             date: "asc",
//         },
//         select: {
//             id: true,
//             date: true,
//             selectedSection: true,
//             selectedDepartment: true,
//             demandTimeFrom: true,
//             demandTimeTo: true,
//             corridorType: true,
//             status: true,
//             sanctionedTimeFrom: true,
//             sanctionedTimeTo: true,
//             AvailedTimeFrom: true,
//             AvailedTimeTo: true,
//             isSanctioned: true,
//             grantedFromTime: true,
//             grantedToTime: true,
//         },
//     });

//     const detailedData = requestDetailsForReport.map((req) => {
//         let durationInHours =
//             (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) / (1000 * 60 * 60);
//         durationInHours = durationInHours < 0 ? durationInHours + 24 : durationInHours;
//         return {
//             id: req.id,
//             Date: new Date(req.date).toLocaleDateString(),
//             Section: req.selectedSection,
//             Duration: durationInHours.toFixed(2),
//             Type: req.corridorType,
//             Status: req.status,
//         };
//     });

//     // 🧮 Calculate actual metrics
//     let totalDemanded = 0;
//     let totalSanctioned = 0;
//     let totalGranted = 0;
//     let totalAvailed = 0;

//     requestDetails.forEach((req) => {
//         // Calculate demanded hours
//         let demandDurationInHours =
//             (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) / (1000 * 60 * 60);
//         demandDurationInHours =
//             demandDurationInHours < 0 ? demandDurationInHours + 24 : demandDurationInHours;
//         totalDemanded += demandDurationInHours;

//         // Calculate sanctioned hours (if sanctioned)
//         if (req.isSanctioned && req.sanctionedTimeFrom && req.sanctionedTimeTo) {
//             let sanctionedDurationInHours =
//                 (new Date(req.sanctionedTimeTo) - new Date(req.sanctionedTimeFrom)) /
//                 (1000 * 60 * 60);
//             sanctionedDurationInHours =
//                 sanctionedDurationInHours < 0
//                     ? sanctionedDurationInHours + 24
//                     : sanctionedDurationInHours;
//             totalSanctioned += sanctionedDurationInHours;
//         }
//         // Calculate granted hours (if available)
//         if (req.grantedFromTime && req.grantedToTime) {
//             let grantedDurationInHours =
//                 (new Date(req.grantedToTime) - new Date(req.grantedFromTime)) / (1000 * 60 * 60);
//             grantedDurationInHours =
//                 grantedDurationInHours < 0 ? grantedDurationInHours + 24 : grantedDurationInHours;
//             totalGranted += grantedDurationInHours;
//         }

//         // Calculate availed hours (if available)
//         if (req.AvailedTimeFrom && req.AvailedTimeTo) {
//             let availedDurationInHours =
//                 (new Date(req.AvailedTimeTo) - new Date(req.AvailedTimeFrom)) / (1000 * 60 * 60);
//             availedDurationInHours =
//                 availedDurationInHours < 0 ? availedDurationInHours + 24 : availedDurationInHours;
//             totalAvailed += availedDurationInHours;
//         }
//     });

//     totalDemanded = parseFloat(totalDemanded.toFixed(2));
//     totalSanctioned = parseFloat(totalSanctioned.toFixed(2));
//     totalGranted = parseFloat(totalGranted.toFixed(2));
//     totalAvailed = parseFloat(totalAvailed.toFixed(2));

//     // Calculate percentages
//     const percentSanctioned =
//         totalDemanded > 0 ? parseFloat(((totalSanctioned / totalDemanded) * 100).toFixed(2)) : 0;

//     const percentGranted =
//         totalDemanded > 0 ? parseFloat(((totalGranted / totalDemanded) * 100).toFixed(2)) : 0;

//     const percentAvailed =
//         totalSanctioned > 0 ? parseFloat(((totalAvailed / totalSanctioned) * 100).toFixed(2)) : 0;

//     const aggregatedMetrics = {
//         Department: location || "All Locations",
//         TotalRequests: requestDetails.length,
//         Demanded: totalDemanded,
//         Approved: totalSanctioned,
//         Granted: totalGranted || totalSanctioned,
//         PercentGranted: percentGranted || percentSanctioned,
//         PercentAvailed: percentAvailed,
//     };

//     return {
//         pastBlockSummary: [aggregatedMetrics],
//         detailedData,
//     };
// };
// src/services/drm.service.js
import prisma from "../prisma/index.js";

// Parse date from DD/MM/YY format and convert to ISO format with correct timezone
// function formatDateForQuery(dateStr) {
//     if (!dateStr) return null;

//     const [day, month, year] = dateStr.split("/");
//     // Convert YY to YYYY
//     const fullYear = `20${year}`;

//     // Format as YYYY-MM-DDT18:30:00.000Z
//     return `${fullYear}-${month}-${day}T18:30:00.000Z`;
// }

function formatDateForQuery(dateStr) {
    if (!dateStr) return null;

    try {
        // Handle both DD/MM/YYYY and DD/MM/YY formats
        const [day, month, year] = dateStr.split("/");
        const fullYear = year.length === 2 ? `20${year}` : year;

        // Create date in local timezone at start of day (00:00:00)
        const date = new Date(`${fullYear}-${month}-${day}T00:00:00`);

        // Convert to ISO string without timezone conversion
        const isoString = `${fullYear}-${month}-${day}T00:00:00.000Z`;

        // For debugging
        console.log("Formatted date:", {
            input: dateStr,
            output: isoString,
            localDate: date.toString(),
        });

        return isoString;
    } catch (error) {
        console.error("Error formatting date:", error);
        return null;
    }
}

export const generateHqReport = async (
    startDate,
    endDate,
    location,
    departments,
    blockTypes,
    majorSections,
) => {
    const whereClause = {};
    const filters = [];

    // 📅 Date filter
    if (startDate && endDate) {
        const formattedStartDate = formatDateForQuery(startDate);
        const formattedEndDate = formatDateForQuery(endDate);
        if (formattedStartDate && formattedEndDate) {
            filters.push({
                date: {
                    gte: formattedStartDate,
                    lte: formattedEndDate,
                },
            });
        }
    }

    // 🏢 Department filter
    if (departments && departments.length > 0) {
        const mappedDepartments = departments.map((dept) => {
            if (dept === "Engineering" || dept === "ENGG") return "ENGG";
            if (dept === "ST" || dept === "S&T") return "S&T";
            if (dept === "TRD") return "TRD";
            return dept;
        });

        filters.push({
            selectedDepartment: {
                in: mappedDepartments,
            },
        });
    }

    // 🚧 Block type filter
    if (
        blockTypes &&
        blockTypes.length > 0 &&
        !(blockTypes.length === 1 && blockTypes[0] === "All")
    ) {
        // const mappedBlockTypes = blockTypes.map((blockType) => {
        //     if (blockType === "Non-corridor") return "Outside Corridor";
        //     if (blockType === "Emergency") return "Urgent Block";
        //     if (blockType === "Corridor") return "Corridor";
        //     if (blockType === "Mega") return "Mega";
        //     return blockType;
        // });
        const mappedBlockTypes = blockTypes.flatMap((blockType) => {
            if (blockType === "Non-corridor") return ["Outside Corridor"];
            if (blockType === "Emergency") return ["Urgent Block"];
            if (blockType === "Corridor") return ["Corridor", "Corridor Block"]; // ✅ BOTH
            if (blockType === "Mega") return ["Mega"];
            return [blockType]; // wrap in array to keep flatMap working
        });

        filters.push({
            corridorType: {
                in: mappedBlockTypes,
            },
        });
    }

    // Combine all filters except major section for the base query
    whereClause.AND = [...filters];

    console.log("Applied filters:", JSON.stringify(whereClause, null, 2));

    // 📊 Get all requests with major section information
    const allRequests = await prisma.request.findMany({
        where: whereClause,
        select: {
            id: true,
            selectedSection: true,
            divisionId: true,
            missionBlock: true,
            selectedDepartment: true,
            corridorType: true,
            demandTimeFrom: true,
            demandTimeTo: true,
            status: true,
            sanctionedTimeFrom: true,
            sanctionedTimeTo: true,
            AvailedTimeFrom: true,
            AvailedTimeTo: true,
            isSanctioned: true,
            grantedFromTime: true,
            grantedToTime: true,
        },
    });

    // Filter requests by major sections if specified
    let filteredRequests = allRequests;
    if (
        majorSections &&
        majorSections.length > 0 &&
        !(majorSections.length === 1 && majorSections[0] === "All")
    ) {
        filteredRequests = allRequests.filter((req) => majorSections.includes(req.selectedSection));
    }

    // Group requests by major section
    const requestsBySection = {};
    filteredRequests.forEach((req) => {
        if (!requestsBySection[req.selectedSection]) {
            requestsBySection[req.selectedSection] = [];
        }
        requestsBySection[req.selectedSection].push(req);
    });

    // Calculate metrics for each section separately
    const pastBlockSummary = Object.entries(requestsBySection).map(([section, requests]) => {
        let totalDemanded = 0;
        let totalSanctioned = 0;
        let totalGranted = 0;
        let totalAvailed = 0;

        requests.forEach((req) => {
            // Calculate demanded hours
            let demandDurationInHours =
                (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) / (1000 * 60 * 60);
            demandDurationInHours =
                demandDurationInHours < 0 ? demandDurationInHours + 24 : demandDurationInHours;
            totalDemanded += demandDurationInHours;

            // Calculate sanctioned hours (if sanctioned)
            if (req.isSanctioned && req.sanctionedTimeFrom && req.sanctionedTimeTo) {
                let sanctionedDurationInHours =
                    (new Date(req.sanctionedTimeTo) - new Date(req.sanctionedTimeFrom)) /
                    (1000 * 60 * 60);
                sanctionedDurationInHours =
                    sanctionedDurationInHours < 0
                        ? sanctionedDurationInHours + 24
                        : sanctionedDurationInHours;
                totalSanctioned += sanctionedDurationInHours;
            }
            // Calculate granted hours (if available)
            if (req.grantedFromTime && req.grantedToTime) {
                let grantedDurationInHours =
                    (new Date(req.grantedToTime) - new Date(req.grantedFromTime)) /
                    (1000 * 60 * 60);
                grantedDurationInHours =
                    grantedDurationInHours < 0
                        ? grantedDurationInHours + 24
                        : grantedDurationInHours;
                totalGranted += grantedDurationInHours;
            }

            // Calculate availed hours (if available)
            if (req.AvailedTimeFrom && req.AvailedTimeTo) {
                let availedDurationInHours =
                    (new Date(req.AvailedTimeTo) - new Date(req.AvailedTimeFrom)) /
                    (1000 * 60 * 60);
                availedDurationInHours =
                    availedDurationInHours < 0
                        ? availedDurationInHours + 24
                        : availedDurationInHours;
                totalAvailed += availedDurationInHours;
            }
        });

        totalDemanded = parseFloat(totalDemanded.toFixed(2));
        totalSanctioned = parseFloat(totalSanctioned.toFixed(2));
        totalGranted = parseFloat(totalGranted.toFixed(2));
        totalAvailed = parseFloat(totalAvailed.toFixed(2));

        // Calculate percentages
        const percentSanctioned =
            totalDemanded > 0
                ? parseFloat(((totalSanctioned / totalDemanded) * 100).toFixed(2))
                : 0;

        const percentGranted =
            // totalDemanded > 0 ? parseFloat(((totalGranted / totalDemanded) * 100).toFixed(2)) : 0;
            totalSanctioned > 0
                ? parseFloat(((totalGranted / totalSanctioned) * 100).toFixed(2))
                : 0;

        const percentAvailed =
            // totalSanctioned > 0 ? parseFloat(((totalAvailed / totalSanctioned) * 100).toFixed(2)) : 0;
            totalGranted > 0 ? parseFloat(((totalAvailed / totalGranted) * 100).toFixed(2)) : 0;

        return {
            Department: section, // Using section name instead of location
            TotalRequests: requests.length,
            Demanded: totalDemanded,
            Approved: totalSanctioned,
            Granted: totalGranted,
            Availed: totalAvailed,
            PercentGranted: percentGranted,
            PercentAvailed: percentAvailed,
        };
    });

    // If no major sections were specified, we'll still get one summary for all requests
    if (pastBlockSummary.length === 0 && filteredRequests.length > 0) {
        // Calculate combined metrics (original behavior)
        let totalDemanded = 0;
        let totalSanctioned = 0;
        let totalGranted = 0;
        let totalAvailed = 0;

        filteredRequests.forEach((req) => {
            // Calculate demanded hours
            let demandDurationInHours =
                (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) / (1000 * 60 * 60);
            demandDurationInHours =
                demandDurationInHours < 0 ? demandDurationInHours + 24 : demandDurationInHours;
            totalDemanded += demandDurationInHours;

            // Calculate sanctioned hours (if sanctioned)
            if (req.isSanctioned && req.sanctionedTimeFrom && req.sanctionedTimeTo) {
                let sanctionedDurationInHours =
                    (new Date(req.sanctionedTimeTo) - new Date(req.sanctionedTimeFrom)) /
                    (1000 * 60 * 60);
                sanctionedDurationInHours =
                    sanctionedDurationInHours < 0
                        ? sanctionedDurationInHours + 24
                        : sanctionedDurationInHours;
                totalSanctioned += sanctionedDurationInHours;
            }
            // Calculate granted hours (if available)
            if (req.grantedFromTime && req.grantedToTime) {
                let grantedDurationInHours =
                    (new Date(req.grantedToTime) - new Date(req.grantedFromTime)) /
                    (1000 * 60 * 60);
                grantedDurationInHours =
                    grantedDurationInHours < 0
                        ? grantedDurationInHours + 24
                        : grantedDurationInHours;
                totalGranted += grantedDurationInHours;
            }

            // Calculate availed hours (if available)
            if (req.AvailedTimeFrom && req.AvailedTimeTo) {
                let availedDurationInHours =
                    (new Date(req.AvailedTimeTo) - new Date(req.AvailedTimeFrom)) /
                    (1000 * 60 * 60);
                availedDurationInHours =
                    availedDurationInHours < 0
                        ? availedDurationInHours + 24
                        : availedDurationInHours;
                totalAvailed += availedDurationInHours;
            }
        });

        totalDemanded = parseFloat(totalDemanded.toFixed(2));
        totalSanctioned = parseFloat(totalSanctioned.toFixed(2));
        totalGranted = parseFloat(totalGranted.toFixed(2));
        totalAvailed = parseFloat(totalAvailed.toFixed(2));

        // Calculate percentages
        const percentSanctioned =
            totalDemanded > 0
                ? parseFloat(((totalSanctioned / totalDemanded) * 100).toFixed(2))
                : 0;

        const percentGranted =
            // totalDemanded > 0 ? parseFloat(((totalGranted / totalDemanded) * 100).toFixed(2)) : 0;
            totalSanctioned > 0
                ? parseFloat(((totalGranted / totalSanctioned) * 100).toFixed(2))
                : 0;

        const percentAvailed =
            // totalSanctioned > 0 ? parseFloat(((totalAvailed / totalSanctioned) * 100).toFixed(2)) : 0;
            totalGranted > 0 ? parseFloat(((totalAvailed / totalGranted) * 100).toFixed(2)) : 0;

        pastBlockSummary.push({
            Department: location || "All Locations",
            TotalRequests: filteredRequests.length,
            Demanded: totalDemanded,
            Approved: totalSanctioned,
            Granted: totalGranted,
            PercentGranted: percentGranted,
            PercentAvailed: percentAvailed,
        });
    }

    // 📋 Detailed report - update the query to include required fields
    const whereClauseNew = {
        AND: [...filters],
    };

    if (
        majorSections &&
        majorSections.length > 0 &&
        !(majorSections.length === 1 && majorSections[0] === "All")
    ) {
        whereClauseNew.AND.push({
            selectedSection: {
                in: majorSections,
            },
        });
    }

    const requestDetailsForReport = await prisma.request.findMany({
        where: whereClauseNew,
        orderBy: {
            date: "asc",
        },
        select: {
            id: true,
            date: true,
            selectedSection: true,
            divisionId: true,
            missionBlock: true,
            selectedDepartment: true,
            demandTimeFrom: true,
            demandTimeTo: true,
            corridorType: true,
            status: true,
            sanctionedTimeFrom: true,
            sanctionedTimeTo: true,
            AvailedTimeFrom: true,
            AvailedTimeTo: true,
            isSanctioned: true,
            grantedFromTime: true,
            grantedToTime: true,
            overAllStatus: true,
            activity: true, // Include activity for detailed report
        },
    });

    const detailedData = requestDetailsForReport.map((req) => {
        let durationInHours =
            (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) / (1000 * 60 * 60);
        durationInHours = durationInHours < 0 ? durationInHours + 24 : durationInHours;
        return {
            id: req.id,
            Date: new Date(req.date).toLocaleDateString(),
            Section: req.selectedSection,
            MissionBlock: req.missionBlock,
            DivisionId: req.divisionId,
            Duration: durationInHours.toFixed(2),
            Type: req.corridorType,
            Status: req.status,
            overAllStatus: req.overAllStatus,
            Activity: req.activity, // Include activity for detailed report
            DemandedTimeFrom: req.demandTimeFrom,
            DemandedTimeTo: req.demandTimeTo,
            SanctionedTimeFrom: req.sanctionedTimeFrom,
            SanctionedTimeTo: req.sanctionedTimeTo,
        };
    });

    return {
        pastBlockSummary,
        detailedData,
    };
};
