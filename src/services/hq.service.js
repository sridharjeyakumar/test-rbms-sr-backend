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
//             if (dept === "Engineering" || dept === "ENGG") return "ENGG";
//             if (dept === "ST" || dept === "S&T") return "S&T";
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
//         // const mappedBlockTypes = blockTypes.map((blockType) => {
//         //     if (blockType === "Non-corridor") return "Outside Corridor";
//         //     if (blockType === "Emergency") return "Urgent Block";
//         //     if (blockType === "Corridor") return "Corridor";
//         //     if (blockType === "Mega") return "Mega";
//         //     return blockType;
//         // });
//         const mappedBlockTypes = blockTypes.flatMap((blockType) => {
//             if (blockType === "Non-corridor") return ["Outside Corridor"];
//             if (blockType === "Emergency") return ["Urgent Block"];
//             if (blockType === "Corridor") return ["Corridor", "Corridor Block"]; // ✅ BOTH
//             if (blockType === "Mega") return ["Mega"];
//             return [blockType]; // wrap in array to keep flatMap working
//         });

//         filters.push({
//             corridorType: {
//                 in: mappedBlockTypes,
//             },
//         });
//     }

//     // Combine all filters except major section for the base query
//     whereClause.AND = [...filters];

//     console.log("Applied filters:", JSON.stringify(whereClause, null, 2));

//     // 📊 Get all requests with major section information
//     const allRequests = await prisma.request.findMany({
//         where: whereClause,
//         select: {
//             id: true,
//             selectedSection: true,
//             divisionId: true,
//             missionBlock: true,
//             selectedDepartment: true,
//             corridorType: true,
//             demandTimeFrom: true,
//             demandTimeTo: true,
//             status: true,
//             sanctionedTimeFrom: true,
//             sanctionedTimeTo: true,
//             AvailedTimeFrom: true,
//             AvailedTimeTo: true,
//             AppliedTimeFrom: true,
//             AppliedTimeTo: true,
//             isSanctioned: true,
//             grantedFromTime: true,
//             grantedToTime: true,
//             isGranted: true,
//             isApplied: true,
//             enggDisconnectionsRequired: true,
//             powerBlockRequired: true,
//             sntDisconnectionRequired: true,
//         },
//     });

//     // Filter requests by major sections if specified
//     let filteredRequests = allRequests;
//     if (
//         majorSections &&
//         majorSections.length > 0 &&
//         !(majorSections.length === 1 && majorSections[0] === "All")
//     ) {
//         filteredRequests = allRequests.filter((req) => majorSections.includes(req.selectedSection));
//     }

//     // Group requests by major section
//     const requestsBySection = {};
//     filteredRequests.forEach((req) => {
//         if (!requestsBySection[req.selectedSection]) {
//             requestsBySection[req.selectedSection] = [];
//         }
//         requestsBySection[req.selectedSection].push(req);
//     });

//     // Calculate metrics for each section separately
//     const pastBlockSummary = Object.entries(requestsBySection).map(([section, requests]) => {
//         let totalDemanded = 0;
//         let totalSanctioned = 0;
//         let totalGranted = 0;
//         let totalAvailed = 0;
//         let totalApplied = 0;

//         requests.forEach((req) => {
//             // Calculate demanded hours
//             let demandDurationInHours =
//                 (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) / (1000 * 60 * 60);
//             demandDurationInHours =
//                 demandDurationInHours < 0 ? demandDurationInHours + 24 : demandDurationInHours;
//             totalDemanded += demandDurationInHours;

//             // Calculate sanctioned hours (if sanctioned)
//             if (req.isSanctioned && req.sanctionedTimeFrom && req.sanctionedTimeTo) {
//                 let sanctionedDurationInHours =
//                     (new Date(req.sanctionedTimeTo) - new Date(req.sanctionedTimeFrom)) /
//                     (1000 * 60 * 60);
//                 sanctionedDurationInHours =
//                     sanctionedDurationInHours < 0
//                         ? sanctionedDurationInHours + 24
//                         : sanctionedDurationInHours;
//                 totalSanctioned += sanctionedDurationInHours;
//             }
//             if (
//                 req.isSanctioned &&
//                 req.isApplied === true &&
//                 req.sanctionedTimeFrom &&
//                 req.sanctionedTimeTo
//             ) {
//                 let sanctionedDurationInHours =
//                     (new Date(req.sanctionedTimeTo) - new Date(req.sanctionedTimeFrom)) /
//                     (1000 * 60 * 60);
//                 sanctionedDurationInHours =
//                     sanctionedDurationInHours < 0
//                         ? sanctionedDurationInHours + 24
//                         : sanctionedDurationInHours;
//                 totalApplied += sanctionedDurationInHours;
//             }
//             // Calculate granted hours (if available)
//             if (req.grantedFromTime && req.grantedToTime) {
//                 let grantedDurationInHours =
//                     (new Date(req.grantedToTime) - new Date(req.grantedFromTime)) /
//                     (1000 * 60 * 60);
//                 grantedDurationInHours =
//                     grantedDurationInHours < 0
//                         ? grantedDurationInHours + 24
//                         : grantedDurationInHours;
//                 totalGranted += grantedDurationInHours;
//             }

//             // Calculate availed hours (if available)
//             if (req.AvailedTimeFrom && req.AvailedTimeTo) {
//                 let availedDurationInHours =
//                     (new Date(req.AvailedTimeTo) - new Date(req.AvailedTimeFrom)) /
//                     (1000 * 60 * 60);
//                 availedDurationInHours =
//                     availedDurationInHours < 0
//                         ? availedDurationInHours + 24
//                         : availedDurationInHours;
//                 totalAvailed += availedDurationInHours;
//             }
//         });

//         totalDemanded = parseFloat(totalDemanded.toFixed(2));
//         totalSanctioned = parseFloat(totalSanctioned.toFixed(2));
//         totalApplied = parseFloat(totalApplied.toFixed(2));
//         totalGranted = parseFloat(totalGranted.toFixed(2));
//         totalAvailed = parseFloat(totalAvailed.toFixed(2));

//         // Calculate percentages
//         const percentSanctioned =
//             totalDemanded > 0
//                 ? parseFloat(((totalSanctioned / totalDemanded) * 100).toFixed(2))
//                 : 0;

//         const percentGranted =
//             // totalDemanded > 0 ? parseFloat(((totalGranted / totalDemanded) * 100).toFixed(2)) : 0;
//             totalSanctioned > 0
//                 ? parseFloat(((totalGranted / totalSanctioned) * 100).toFixed(2))
//                 : 0;

//         const percentAvailed =
//             // totalSanctioned > 0 ? parseFloat(((totalAvailed / totalSanctioned) * 100).toFixed(2)) : 0;
//             totalGranted > 0 ? parseFloat(((totalAvailed / totalGranted) * 100).toFixed(2)) : 0;

//         // Count the number of blocks by status
//         const demandsCount = requests.length; // All requests are demands
//         const approvedCount = requests.filter((req) => req.isSanctioned === true).length;
//         const availedCount = requests.filter(
//             (req) => req.AvailedTimeFrom && req.AvailedTimeTo,
//         ).length;
//         const grantedCount = requests.filter((req) => req.isGranted === true).length;
//         const appliedCount = requests.filter((req) => req.isApplied === true).length;
//         const notGranted= requests.filter((req) => req.isGranted === false).length;
//         const notAvailed= requests.filter((req) => (!req.AvailedTimeFrom&&!req.AvailedTimeTo&&req.isApplied===null|false)).length;

//         return {
//             Department: section, // Using section name instead of location
//             TotalRequests: requests.length,
//             MissionBlocks: requests.MissionBlocks,
//             Demanded: totalDemanded,
//             Approved: totalSanctioned,
//             Granted: totalGranted,
//             Availed: totalAvailed,
//             Applied: totalApplied,
//             PercentGranted: percentGranted,
//             PercentAvailed: percentAvailed,
//             // Adding block counts
//             DemandsCount: demandsCount,
//             ApprovedCount: approvedCount,
//             AvailedCount: availedCount,
//             GrantedCount: grantedCount,
//             AppliedCount: appliedCount,
//             NotGrantedCount: notGranted,
//             NotAvailedCount: notAvailed,
//         };
//     });

//     // If no major sections were specified, we'll still get one summary for all requests
//     if (pastBlockSummary.length === 0 && filteredRequests.length > 0) {
//         // Calculate combined metrics (original behavior)
//         let totalDemanded = 0;
//         let totalSanctioned = 0;
//         let totalGranted = 0;
//         let totalAvailed = 0;

//         filteredRequests.forEach((req) => {
//             // Calculate demanded hours
//             let demandDurationInHours =
//                 (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) / (1000 * 60 * 60);
//             demandDurationInHours =
//                 demandDurationInHours < 0 ? demandDurationInHours + 24 : demandDurationInHours;
//             totalDemanded += demandDurationInHours;

//             // Calculate sanctioned hours (if sanctioned)
//             if (req.isSanctioned && req.sanctionedTimeFrom && req.sanctionedTimeTo) {
//                 let sanctionedDurationInHours =
//                     (new Date(req.sanctionedTimeTo) - new Date(req.sanctionedTimeFrom)) /
//                     (1000 * 60 * 60);
//                 sanctionedDurationInHours =
//                     sanctionedDurationInHours < 0
//                         ? sanctionedDurationInHours + 24
//                         : sanctionedDurationInHours;
//                 totalSanctioned += sanctionedDurationInHours;
//             }
//             // Calculate granted hours (if available)
//             if (req.grantedFromTime && req.grantedToTime) {
//                 let grantedDurationInHours =
//                     (new Date(req.grantedToTime) - new Date(req.grantedFromTime)) /
//                     (1000 * 60 * 60);
//                 grantedDurationInHours =
//                     grantedDurationInHours < 0
//                         ? grantedDurationInHours + 24
//                         : grantedDurationInHours;
//                 totalGranted += grantedDurationInHours;
//             }

//             // Calculate availed hours (if available)
//             if (req.AvailedTimeFrom && req.AvailedTimeTo) {
//                 let availedDurationInHours =
//                     (new Date(req.AvailedTimeTo) - new Date(req.AvailedTimeFrom)) /
//                     (1000 * 60 * 60);
//                 availedDurationInHours =
//                     availedDurationInHours < 0
//                         ? availedDurationInHours + 24
//                         : availedDurationInHours;
//                 totalAvailed += availedDurationInHours;
//             }
//         });

//         totalDemanded = parseFloat(totalDemanded.toFixed(2));
//         totalSanctioned = parseFloat(totalSanctioned.toFixed(2));
//         totalGranted = parseFloat(totalGranted.toFixed(2));
//         totalAvailed = parseFloat(totalAvailed.toFixed(2));

//         // Calculate percentages
//         const percentSanctioned =
//             totalDemanded > 0
//                 ? parseFloat(((totalSanctioned / totalDemanded) * 100).toFixed(2))
//                 : 0;

//         const percentGranted =
//             // totalDemanded > 0 ? parseFloat(((totalGranted / totalDemanded) * 100).toFixed(2)) : 0;
//             totalSanctioned > 0
//                 ? parseFloat(((totalGranted / totalSanctioned) * 100).toFixed(2))
//                 : 0;

//         const percentAvailed =
//             // totalSanctioned > 0 ? parseFloat(((totalAvailed / totalSanctioned) * 100).toFixed(2)) : 0;
//             totalGranted > 0 ? parseFloat(((totalAvailed / totalGranted) * 100).toFixed(2)) : 0;

//         // Count the number of blocks by status
//         const demandsCount = filteredRequests.length; // All requests are demands
//         const approvedCount = filteredRequests.filter((req) => req.isSanctioned === true).length;
//         const availedCount = filteredRequests.filter(
//             (req) => req.AvailedTimeFrom && req.AvailedTimeTo,
//         ).length;

//         pastBlockSummary.push({
//             Department: location || "All Locations",
//             TotalRequests: filteredRequests.length,
//             Demanded: totalDemanded,
//             Approved: totalSanctioned,
//             Granted: totalGranted,
//             PercentGranted: percentGranted,
//             PercentAvailed: percentAvailed,
//             // Adding block counts
//             DemandsCount: demandsCount,
//             ApprovedCount: approvedCount,
//             AvailedCount: availedCount,
//         });
//     }

//     // 📋 Detailed report - update the query to include required fields
//     const whereClauseNew = {
//         AND: [...filters],
//     };

//     if (
//         majorSections &&
//         majorSections.length > 0 &&
//         !(majorSections.length === 1 && majorSections[0] === "All")
//     ) {
//         whereClauseNew.AND.push({
//             selectedSection: {
//                 in: majorSections,
//             },
//         });
//     }

//     const requestDetailsForReport = await prisma.request.findMany({
//         where: whereClauseNew,
//         orderBy: {
//             date: "asc",
//         },
//         select: {
//             id: true,
//             date: true,
//             selectedSection: true,
//             divisionId: true,
//             missionBlock: true,
//             selectedDepartment: true,
//             demandTimeFrom: true,
//             demandTimeTo: true,
//             corridorType: true,
//             stationID: true,
//             isApplied: true,
//             enggDisconnectionsRequired: true,
//             sntDisconnectionRequired: true,
//             AppliedTimeFrom: true,
//             AppliedTimeTo: true,
//             powerBlockRequired: true,
//             isGranted: true,
//             isSanctioned: true,
//             status: true,
//             sanctionedTimeFrom: true,
//             sanctionedTimeTo: true,
//             AvailedTimeFrom: true,
//             AvailedTimeTo: true,
//             isSanctioned: true,
//             grantedFromTime: true,
//             grantedToTime: true,
//             overAllStatus: true,
//             activity: true, // Include activity for detailed report
//             selectedDepo: true,
//             user: {
//                 // Add this include section
//                 select: {
//                     id: true,
//                     name: true,
//                     email: true,
//                     role: true,
//                 },
//             },
//             userResponse: true,
//             userAcceptanceForSanction: true,
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
//             MissionBlock: req.missionBlock,
//             DivisionId: req.divisionId,
//             Duration: durationInHours.toFixed(2),
//             stationId: req.stationID,
//             isApplied: req.isApplied,
//             isGranted: req.isGranted,
//             isSanctioned: req.isSanctioned,
//             Type: req.corridorType,
//             Status: req.status,
//             overAllStatus: req.overAllStatus,
//             Activity: req.activity, // Include activity for detailed report
//             DemandedTimeFrom: req.demandTimeFrom,
//             DemandedTimeTo: req.demandTimeTo,
//             SanctionedTimeFrom: req.sanctionedTimeFrom,
//             SanctionedTimeTo: req.sanctionedTimeTo,
//             AvailedTimeFrom: req.AvailedTimeFrom,
//             AvailedTimeTo: req.AvailedTimeTo,
//             selectedDepo: req.selectedDepo,
//             enggDisconnectionsRequired: req.enggDisconnectionsRequired,
//             appliedTimeFrom: req.AppliedTimeFrom,
//             appliedTimeTo: req.AppliedTimeTo,
//             powerBlockRequired: req.powerBlockRequired,
//             sntDisconnectionRequired: req.sntDisconnectionRequired,
//             selectedDepartment: req.selectedDepartment,
//             userId: req.user?.id,
//             userName: req.user?.name,
//             userEmail: req.user?.email,
//             userRole: req.user?.role,
//             userResponse: req.userResponse,
//             userAcceptanceForSanction: req.userAcceptanceForSanction,
//         };
//     });

//     return {
//         pastBlockSummary,
//         detailedData,
//     };
// };

export const generateHqReport = async (
    startDate,
    endDate,
    location,
    departments,
    blockTypes,
    majorSections,
    globalWorkType = "ALL",
    globalActivity = "ALL",
    durationOperator = "ALL", // CHANGED: from globalTimeSlot
    durationValue = "",
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
        const mappedBlockTypes = blockTypes.flatMap((blockType) => {
            if (blockType === "Non-corridor") return ["Outside Corridor"];
            if (blockType === "Emergency") return ["Urgent Block"];
            if (blockType === "Corridor") return ["Corridor", "Corridor Block"];
            if (blockType === "Mega") return ["Mega"];
            return [blockType];
        });

        filters.push({
            corridorType: {
                in: mappedBlockTypes,
            },
        });
    }

    // === ADD THE 3 NEW FILTERS ===

    // Work Type filter
    if (globalWorkType !== "ALL") {
        filters.push({
            workType: globalWorkType,
        });
    }

    // Activity filter
    // Activity filter with contains (if you want partial matching)
    if (globalActivity !== "ALL") {
        filters.push({
            activity: {
                contains: globalActivity, // This will match "CSM", "CSM ", "CSM something"
                mode: "insensitive",
            },
        });
    }

    // Combine all filters for database query
    whereClause.AND = [...filters];

    console.log("Applied database filters:", JSON.stringify(whereClause, null, 2));
    console.log("Additional filters:", {
        globalWorkType,
        globalActivity,
        durationOperator,
        durationValue,
    });

    // 📊 Get all requests with the combined filters
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
            AppliedTimeFrom: true,
            AppliedTimeTo: true,
            isSanctioned: true,
            grantedFromTime: true,
            grantedToTime: true,
            isGranted: true,
            isApplied: true,
            enggDisconnectionsRequired: true,
            powerBlockRequired: true,
            sntDisconnectionRequired: true,
            activity: true,
            workType: true,
            date: true,
            selectedDepo: true,
            stationID: true,
            overAllStatus: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            userResponse: true,
            userAcceptanceForSanction: true,
        },
    });

    let durationFilteredRequests = allRequests;

    // Apply duration filtering if specified
    if (durationOperator !== "ALL" && durationValue) {
        const durationNum = parseFloat(durationValue);

        if (!isNaN(durationNum)) {
            durationFilteredRequests = allRequests.filter((req) => {
                if (!req.demandTimeFrom || !req.demandTimeTo) return false;

                // Calculate duration in hours
                const demandTimeFrom = new Date(req.demandTimeFrom);
                const demandTimeTo = new Date(req.demandTimeTo);
                let durationInHours = (demandTimeTo - demandTimeFrom) / (1000 * 60 * 60);

                // Handle overnight blocks (negative duration)
                if (durationInHours < 0) {
                    durationInHours += 24;
                }

                // Apply the selected operator
                switch (durationOperator) {
                    case ">":
                        return durationInHours > durationNum;
                    case ">=":
                        return durationInHours >= durationNum;
                    case "=":
                        return Math.abs(durationInHours - durationNum) < 0.1; // Allow small floating point differences
                    case "<=":
                        return durationInHours <= durationNum;
                    case "<":
                        return durationInHours < durationNum;
                    default:
                        return true;
                }
            });

            console.log(
                `Duration filtering (${durationOperator} ${durationValue}h): ${allRequests.length} -> ${durationFilteredRequests.length} requests`,
            );
        }
    }

    // Use durationFilteredRequests for the rest of your processing
    let filteredRequests = durationFilteredRequests;

    // Filter by major sections if specified
    if (
        majorSections &&
        majorSections.length > 0 &&
        !(majorSections.length === 1 && majorSections[0] === "All")
    ) {
        filteredRequests = durationFilteredRequests.filter((req) =>
            majorSections.includes(req.selectedSection),
        );
        console.log(
            `Major section filtering: ${durationFilteredRequests.length} -> ${filteredRequests.length} requests`,
        );
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
        let totalApplied = 0;

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
            if (
                req.isSanctioned &&
                req.isApplied === true &&
                req.sanctionedTimeFrom &&
                req.sanctionedTimeTo
            ) {
                let sanctionedDurationInHours =
                    (new Date(req.sanctionedTimeTo) - new Date(req.sanctionedTimeFrom)) /
                    (1000 * 60 * 60);
                sanctionedDurationInHours =
                    sanctionedDurationInHours < 0
                        ? sanctionedDurationInHours + 24
                        : sanctionedDurationInHours;
                totalApplied += sanctionedDurationInHours;
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
        totalApplied = parseFloat(totalApplied.toFixed(2));
        totalGranted = parseFloat(totalGranted.toFixed(2));
        totalAvailed = parseFloat(totalAvailed.toFixed(2));

        // Calculate percentages
        // const percentGranted =
        //     totalSanctioned > 0
        //         ? parseFloat(((totalGranted / totalSanctioned) * 100).toFixed(2))
        //         : 0;

        const percentGranted =
            totalApplied > 0 ? parseFloat(((totalGranted / totalApplied) * 100).toFixed(2)) : 0;
        const percentAvailed =
            totalGranted > 0 ? parseFloat(((totalAvailed / totalGranted) * 100).toFixed(2)) : 0;

        // Count the number of blocks by status
        const demandsCount = requests.length;
        const approvedCount = requests.filter((req) => req.isSanctioned === true).length;
        const availedCount = requests.filter(
            (req) => req.AvailedTimeFrom && req.AvailedTimeTo,
        ).length;
        const grantedCount = requests.filter((req) => req.isGranted === true).length;
        const appliedCount = requests.filter((req) => req.isApplied === true).length;
        const notGranted = requests.filter(
            (req) => req.isGranted === false && req.isApplied === true,
        ).length;
        const notAvailed = requests.filter(
            (req) =>
                (req.isSanctioned && !req.AvailedTimeFrom && !req.AvailedTimeTo) ||
                (req.isApplied === null && req.isGranted === true) ||
                req.isApplied === false ||
                (req.userResponse !== "ACCEPTED" &&
                    req.useAcceptanceForSanction === false &&
                    req.isSanctioned === true),
        ).length;

        return {
            Department: section,
            TotalRequests: requests.length,
            MissionBlocks: requests.MissionBlock,
            Demanded: totalDemanded,
            Approved: totalSanctioned,
            Granted: totalGranted,
            Availed: totalAvailed,
            Applied: totalApplied,
            PercentGranted: percentGranted,
            PercentAvailed: percentAvailed,
            DemandsCount: demandsCount,
            ApprovedCount: approvedCount,
            AvailedCount: availedCount,
            GrantedCount: grantedCount,
            AppliedCount: appliedCount,
            NotGrantedCount: notGranted,
            NotAvailedCount: notAvailed,
        };
    });

    // If no major sections were specified, we'll still get one summary for all requests
    if (pastBlockSummary.length === 0 && filteredRequests.length > 0) {
        // Calculate combined metrics (original behavior)
        let totalDemanded = 0;
        let totalSanctioned = 0;
        let totalGranted = 0;
        let totalAvailed = 0;
        let totalApplied = 0;

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
            if (
                req.isSanctioned &&
                req.isApplied === true &&
                req.sanctionedTimeFrom &&
                req.sanctionedTimeTo
            ) {
                let sanctionedDurationInHours =
                    (new Date(req.sanctionedTimeTo) - new Date(req.sanctionedTimeFrom)) /
                    (1000 * 60 * 60);
                sanctionedDurationInHours =
                    sanctionedDurationInHours < 0
                        ? sanctionedDurationInHours + 24
                        : sanctionedDurationInHours;
                totalApplied += sanctionedDurationInHours;
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
        totalApplied = parseFloat(totalApplied.toFixed(2));
        totalGranted = parseFloat(totalGranted.toFixed(2));
        totalAvailed = parseFloat(totalAvailed.toFixed(2));

        // Calculate percentages
        // const percentGranted =
        //     totalSanctioned > 0
        //         ? parseFloat(((totalGranted / totalSanctioned) * 100).toFixed(2))
        //         : 0;

        const percentGranted =
            totalApplied > 0 ? parseFloat(((totalGranted / totalApplied) * 100).toFixed(2)) : 0;
        const percentAvailed =
            totalGranted > 0 ? parseFloat(((totalAvailed / totalGranted) * 100).toFixed(2)) : 0;

        // Count the number of blocks by status
        const demandsCount = filteredRequests.length;
        const approvedCount = filteredRequests.filter((req) => req.isSanctioned === true).length;
        const availedCount = filteredRequests.filter(
            (req) => req.AvailedTimeFrom && req.AvailedTimeTo,
        ).length;
        const grantedCount = filteredRequests.filter((req) => req.isGranted === true).length;
        const appliedCount = filteredRequests.filter((req) => req.isApplied === true).length;
        const notGranted = filteredRequests.filter((req) => req.isGranted === false).length;
        const notAvailed = filteredRequests.filter(
            (req) =>
                !req.AvailedTimeFrom &&
                !req.AvailedTimeTo &&
                (req.isApplied === null || req.isApplied === false),
        ).length;

        pastBlockSummary.push({
            Department: location || "All Locations",
            TotalRequests: filteredRequests.length,
            MissionBlocks: filteredRequests.map((req) => req.missionBlock),
            Demanded: totalDemanded,
            Approved: totalSanctioned,
            Granted: totalGranted,
            Availed: totalAvailed,
            Applied: totalApplied,
            PercentGranted: percentGranted,
            PercentAvailed: percentAvailed,
            DemandsCount: demandsCount,
            ApprovedCount: approvedCount,
            AvailedCount: availedCount,
            GrantedCount: grantedCount,
            AppliedCount: appliedCount,
            NotGrantedCount: notGranted,
            NotAvailedCount: notAvailed,
        });
    }

    // 📋 Detailed report data
    const detailedData = filteredRequests.map((req) => {
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
            stationId: req.stationID,
            isApplied: req.isApplied,
            isGranted: req.isGranted,
            isSanctioned: req.isSanctioned,
            Type: req.corridorType,
            Status: req.status,
            overAllStatus: req.overAllStatus,
            Activity: req.activity,
            workType: req.workType,
            DemandedTimeFrom: req.demandTimeFrom,
            DemandedTimeTo: req.demandTimeTo,
            SanctionedTimeFrom: req.sanctionedTimeFrom,
            SanctionedTimeTo: req.sanctionedTimeTo,
            AvailedTimeFrom: req.AvailedTimeFrom,
            AvailedTimeTo: req.AvailedTimeTo,
            selectedDepo: req.selectedDepo,
            enggDisconnectionsRequired: req.enggDisconnectionsRequired,
            appliedTimeFrom: req.AppliedTimeFrom,
            appliedTimeTo: req.AppliedTimeTo,
            powerBlockRequired: req.powerBlockRequired,
            sntDisconnectionRequired: req.sntDisconnectionRequired,
            selectedDepartment: req.selectedDepartment,
            userId: req.user?.id,
            userName: req.user?.name,
            userEmail: req.user?.email,
            userRole: req.user?.role,
            userResponse: req.userResponse,
            userAcceptanceForSanction: req.userAcceptanceForSanction,
        };
    });

    return {
        pastBlockSummary,
        detailedData,
    };
};
