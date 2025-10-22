// src/services/hq.service.js
import prisma from "../prisma/index.js";

// Parse date from DD/MM/YY format and convert to ISO format with correct timezone
function formatDateForQuery(dateStr) {
    if (!dateStr) return null;

    const [day, month, year] = dateStr.split("/");
    // Convert YY to YYYY
    const fullYear = `20${year}`;

    // Format as YYYY-MM-DDT18:30:00.000Z
    return `${fullYear}-${month}-${day}T18:30:00.000Z`;
}

// // Generate HQ Report based on filters
// export const generateDrmReport = async (
//     startDate,
//     endDate,
//     majorSections,
//     departments,
//     blockTypes,
// ) => {
//     // Build where clause based on filters
//     const whereClause = {};

//     // Add filters only if they exist
//     const filters = [];

//     // Add date filter if provided
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

//     // Add mission block filter if provided (majorSections represents mission blocks)
//     if (majorSections && majorSections.length > 0) {
//         filters.push({
//             selectedSection: {
//                 in: majorSections,
//             },
//         });
//     }

//     // Add department filter if provided
//     if (departments && departments.length > 0) {
//         // Map from query params to DB values: Engineering -> ENGG, ST -> S&T
//         const mappedDepartments = departments.map((dept) => {
//             if (dept === "Engineering") return "ENGG";
//             if (dept === "ST") return "S&T";
//             return dept; // Keep other values as is
//         });

//         filters.push({
//             selectedDepartment: {
//                 in: mappedDepartments,
//             },
//         });
//     }

//     // Add blockType filter if provided
//     if (blockTypes && blockTypes.length > 0) {
//         // Map blockType values from query params to database values
//         const mappedBlockTypes = blockTypes.map((blockType) => {
//             // Apply specific mappings
//             if (blockType === "Non-corridor") return "Outside Corridor";
//             if (blockType === "Emergency") return "Urgent Block";
//             if (blockType === "Corridor") return "Corridor";
//             return blockType; // Keep other values as is
//         });

//         filters.push({
//             corridorType: {
//                 in: mappedBlockTypes,
//             },
//         });
//     }

//     // Combine all filters with AND
//     whereClause.AND = filters;

//     // Safely log the filter conditions without assuming specific index positions
//     console.log("Applied HQ filters:", JSON.stringify(whereClause, null, 2));

//     // Get detailed data for each request matching the criteria to calculate metrics
//     const requestDetails = await prisma.request.findMany({
//         where: whereClause,
//         select: {
//             id: true,
//             missionBlock: true,
//             selectedSection: true,
//             selectedDepartment: true,
//             corridorType: true,
//             demandTimeFrom: true,
//             demandTimeTo: true,
//             status: true,
//             sanctionedTimeFrom: true,
//             sanctionedTimeTo: true,
//             AvailedTimeFrom: true,
//             AvailedTimeTo: true,
//             grantedFromTime: true,
//             grantedToTime: true,
//             isSanctioned: true,
//         },
//     });

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const whereClauseNew = {
//         date: {
//             gte: today,
//         },
//         selectedSection: {
//             in: majorSections,
//         },
//     };

//     // Get additional details for reporting purposes - using the same filter as the main query
//     const requestDetailsForReport = await prisma.request.findMany({
//         where: whereClauseNew,
//         orderBy: {
//             date: "asc", // sorted by date, oldest first
//         },
//         select: {
//             id: true,
//             date: true,
//             missionBlock: true, // Mission Block
//             selectedDepartment: true,
//             selectedSection: true,
//             demandTimeFrom: true,
//             demandTimeTo: true,
//             corridorType: true, // Type
//             status: true, // Status
//             sanctionedTimeFrom: true,
//             sanctionedTimeTo: true,
//             AvailedTimeFrom: true,
//             AvailedTimeTo: true,
//             grantedFromTime: true,
//             grantedToTime: true,
//             isSanctioned: true,
//         },
//     });

//     // Calculate duration for each request in hours
//     // Include the fields: Date, MissionBlock, Duration, Type, Status
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

//     // Calculate aggregate metrics for all requests without grouping
//     // Calculate total demanded hours
//     // let totalDemanded = 0;
//     // requestDetails.forEach((req) => {
//     //     let durationInHours =
//     //         (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) / (1000 * 60 * 60);
//     //     durationInHours = durationInHours < 0 ? durationInHours + 24 : durationInHours;
//     //     totalDemanded += durationInHours;
//     // });

//     // // Create single metrics object with aggregated values
//     // const aggregatedMetrics = {
//     //     Department: majorSections.join(", "),
//     //     TotalRequests: requestDetails.length,
//     //     Demanded: parseFloat(totalDemanded.toFixed(2)),
//     //     Approved: parseFloat((totalDemanded * 0.9).toFixed(2)), // placeholder: 90%
//     //     Granted: parseFloat((totalDemanded * 0.8).toFixed(2)), // placeholder: 80%
//     //     PercentGranted: 80, // placeholder
//     //     Availed: parseFloat((totalDemanded * 0.7).toFixed(2)), // placeholder: 70%
//     //     PercentAvailed: 70, // placeholder
//     // };

//     const sectionDurations = {}; // { majorSection: totalDuration }
//     console.log(requestDetails.length);

//     // Ensure all majorSections are represented, even if no data
//     // Create a set of all expected major sections
//     const allMajorSections = new Set(majorSections); // assuming majorSections is an array parameter

//     requestDetails.forEach((req) => {
//         const section = req.majorSection; // or req.majorsection depending on your data
//         let durationInHours =
//             (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) / (1000 * 60 * 60);
//         durationInHours = durationInHours < 0 ? durationInHours + 24 : durationInHours;

//         if (!sectionDurations[section]) {
//             sectionDurations[section] = {
//                 totalDemanded: 0,
//                 totalRequests: 0,
//             };
//         }

//         sectionDurations[section].totalDemanded += durationInHours;
//         sectionDurations[section].totalRequests += 1;
//     });
//     console.log(requestDetails.length);

//     // Create summary per majorSection and add a total summary
//     const pastBlockSummary = [];
//     // First, add entries for all expected major sections
//     allMajorSections.forEach((section) => {
//         // Count requests for this section
//         const sectionRequests = requestDetails.filter((req) => req.selectedSection === section);
//         const totalRequests = sectionRequests.length;

//         // Calculate total demanded hours for this section
//         let totalDemanded = 0;
//         let totalSanctioned = 0;
//         let totalAvailed = 0;
//         let totalGranted = 0;

//         sectionRequests.forEach((req) => {
//             // Calculate demanded hours
//             let demandDurationInHours =
//                 (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) / (1000 * 60 * 60);
//             demandDurationInHours =
//                 demandDurationInHours < 0 ? demandDurationInHours + 24 : demandDurationInHours;
//             totalDemanded += demandDurationInHours;

//             // Calculate sanctioned hours if available
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

//             // Calculate granted hours if available

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

//             // Calculate availed hours if available
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

//         const percentSanctioned =
//             totalDemanded > 0
//                 ? parseFloat(((totalSanctioned / totalDemanded) * 100).toFixed(2))
//                 : 0;
//         const percentGranted =
//             totalDemanded > 0 ? parseFloat(((totalGranted / totalDemanded) * 100).toFixed(2)) : 0;
//         const percentAvailed =
//             totalSanctioned > 0
//                 ? parseFloat(((totalAvailed / totalSanctioned) * 100).toFixed(2))
//                 : 0;

//         // Create summary object for this section
//         pastBlockSummary.push({
//             Department: section,
//             TotalRequests: totalRequests,
//             Demanded: totalDemanded,
//             Approved: totalSanctioned,
//             Granted: totalGranted || totalSanctioned,
//             PercentGranted: percentGranted || percentSanctioned,
//             Availed: totalAvailed,
//             PercentAvailed: percentAvailed,
//         });
//     });

//     return {
//         // Single aggregated metrics object with Department-wise data
//         pastBlockSummary: pastBlockSummary,
//         // Array with the detailed data, containing specific fields
//         detailedData: detailedData,
//     };
// };

// export const generateDrmReport = async (
//   startDate,
//   endDate,
//   majorSections, // Always empty (ignored)
//   departments,
//   blockTypes
// ) => {
//   // 1. Build the base WHERE clause with user-provided filters
//   const filters = [];

//   // Date filter (if provided)
//   if (startDate && endDate) {
//     const formattedStartDate = formatDateForQuery(startDate);
//     const formattedEndDate = formatDateForQuery(endDate);

//     if (formattedStartDate && formattedEndDate) {
//       filters.push({
//         date: {
//           gte: formattedStartDate,
//           lte: formattedEndDate,
//         },
//       });
//     }
//   }

//   // Department filter (if provided)
//   if (departments?.length > 0) {
//     const mappedDepartments = departments.map((dept) => {
//       if (dept === "Engineering") return "ENGG";
//       if (dept === "ST") return "S&T";
//       return dept;
//     });

//     filters.push({
//       selectedDepartment: {
//         in: mappedDepartments,
//       },
//     });
//   }

//   // Block type filter (if provided)
//   if (blockTypes?.length > 0) {
//     const mappedBlockTypes = blockTypes.map((blockType) => {
//       if (blockType === "Non-corridor") return "Outside Corridor";
//       if (blockType === "Emergency") return "Urgent Block";
//       if (blockType === "Corridor") return "Corridor";
//       return blockType;
//     });

//     filters.push({
//       corridorType: {
//         in: mappedBlockTypes,
//       },
//     });
//   }

//   // Combined WHERE clause
//   const whereClause = filters.length > 0 ? { AND: filters } : {};

//   console.log("Final WHERE clause:", JSON.stringify(whereClause, null, 2));

//   // 2. Fetch ALL historical data matching filters
//   const requestDetails = await prisma.request.findMany({
//     where: whereClause,
//     select: {
//       id: true,
//       selectedSection: true,
//       demandTimeFrom: true,
//       demandTimeTo: true,
//       status: true,
//       corridorType: true,
//       sanctionedTimeFrom: true,
//       sanctionedTimeTo: true,
//       AvailedTimeFrom: true,
//       AvailedTimeTo: true,
//       grantedFromTime: true,
//       grantedToTime: true,
//       isSanctioned: true,
//     },
//   });

//   // 3. Fetch data for detailed report (using same filters, no date restriction)
//   const requestDetailsForReport = await prisma.request.findMany({
//     where: whereClause, // Same filters as historical data
//     orderBy: { date: "asc" },
//     select: {
//       id: true,
//       date: true,
//       selectedSection: true,
//       demandTimeFrom: true,
//       demandTimeTo: true,
//       corridorType: true,
//       status: true,
//     },
//   });

//   // 4. Calculate metrics for ALL sections combined
//   let totalDemanded = 0;
//   let totalSanctioned = 0;
//   let totalGranted = 0;
//   let totalAvailed = 0;
//   const totalRequests = requestDetails.length;

//   requestDetails.forEach((req) => {
//     // Calculate demanded hours
//     const demandedHours =
//       (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) /
//       (1000 * 60 * 60);
//     totalDemanded += demandedHours < 0 ? demandedHours + 24 : demandedHours;

//     // Calculate sanctioned hours (if available)
//     if (req.isSanctioned && req.sanctionedTimeFrom && req.sanctionedTimeTo) {
//       const sanctionedHours =
//         (new Date(req.sanctionedTimeTo) - new Date(req.sanctionedTimeFrom)) /
//         (1000 * 60 * 60);
//       totalSanctioned += sanctionedHours < 0 ? sanctionedHours + 24 : sanctionedHours;
//     }

//     // Calculate granted hours (if available)
//     if (req.grantedFromTime && req.grantedToTime) {
//       const grantedHours =
//         (new Date(req.grantedToTime) - new Date(req.grantedFromTime)) /
//         (1000 * 60 * 60);
//       totalGranted += grantedHours < 0 ? grantedHours + 24 : grantedHours;
//     }

//     // Calculate availed hours (if available)
//     if (req.AvailedTimeFrom && req.AvailedTimeTo) {
//       const availedHours =
//         (new Date(req.AvailedTimeTo) - new Date(req.AvailedTimeFrom)) /
//         (1000 * 60 * 60);
//       totalAvailed += availedHours < 0 ? availedHours + 24 : availedHours;
//     }
//   });

//   // Calculate percentages
//   const percentSanctioned = totalDemanded
//     ? (totalSanctioned / totalDemanded) * 100
//     : 0;
//   const percentGranted = totalDemanded
//     ? (totalGranted / totalDemanded) * 100
//     : 0;
//   const percentAvailed = totalSanctioned
//     ? (totalAvailed / totalSanctioned) * 100
//     : 0;

//   const combinedSummary = [{
//     Department: "All Sections",
//     TotalRequests: totalRequests,
//     Demanded: parseFloat(totalDemanded.toFixed(2)),
//     Approved: parseFloat(totalSanctioned.toFixed(2)),
//     Granted: parseFloat(totalGranted.toFixed(2)),
//     PercentGranted: parseFloat(percentGranted.toFixed(2)),
//     Availed: parseFloat(totalAvailed.toFixed(2)),
//     PercentAvailed: parseFloat(percentAvailed.toFixed(2)),
//   }];

//   // 5. Prepare detailed data (now includes all matching records)
//   const detailedData = requestDetailsForReport.map((req) => ({
//     id: req.id,
//     Date: new Date(req.date).toLocaleDateString(),
//     Section: req.selectedSection,
//     Duration: (
//       (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) /
//       (1000 * 60 * 60)
//     ).toFixed(2),
//     Type: req.corridorType,
//     Status: req.status,
//   }));

//   return {
//     pastBlockSummary: combinedSummary, // Now returns a single combined summary
//     detailedData,
//   };
// };

// export const generateDrmReport = async (
//     startDate,
//     endDate,
//     majorSections, // Always empty (ignored)
//     departments,
//     blockTypes,
//     locations, // ["ALL"] or ["MAS", "SA", etc.]
// ) => {
//     // 1. Build the base WHERE clause with user-provided filters
//     const filters = [];

//     // Date filter (if provided)
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

//     // Department filter (if provided)
//     if (departments?.length > 0) {
//         const mappedDepartments = departments.map((dept) => {
//             if (dept === "Engineering") return "ENGG";
//             if (dept === "ST") return "S&T";
//             return dept;
//         });

//         filters.push({
//             selectedDepartment: {
//                 in: mappedDepartments,
//             },
//         });
//     }

//     // Block type filter (if provided)
//     // if (blockTypes?.length > 0) {
//     //     const mappedBlockTypes = blockTypes.map((blockType) => {
//     //         if (blockType === "Non-corridor") return "Outside Corridor";
//     //         if (blockType === "Emergency") return "Urgent Block";
//     //         if (blockType === "Corridor") return "Corridor";
//     //         return blockType;
//     //     });

//     //     filters.push({
//     //         corridorType: {
//     //             in: mappedBlockTypes,
//     //         },
//     //     });
//     // }

//     // Block type filter (if provided and not "All")
//     if (blockTypes?.length > 0 && !blockTypes.includes("All")) {
//         const mappedBlockTypes = blockTypes.map((blockType) => {
//             if (blockType === "Non-corridor") return "Outside Corridor";
//             if (blockType === "Emergency") return "Urgent Block";
//             if (blockType === "Corridor") return "Corridor";
//             return blockType;
//         });

//         filters.push({
//             corridorType: {
//                 in: mappedBlockTypes,
//             },
//         });
//     }

//     // Location filter (if provided and not "ALL")
//     let locationFilter = {};
//     if (locations?.length > 0 && !locations.includes("ALL")) {
//         locationFilter = {
//             user: {
//                 location: {
//                     in: locations,
//                 },
//             },
//         };
//     }

//     // Combined WHERE clause
//     const whereClause = filters.length > 0 ? { AND: [...filters, locationFilter] } : locationFilter;

//     console.log("Final WHERE clause:", JSON.stringify(whereClause, null, 2));

//     // 2. Fetch ALL historical data matching filters with user location
//     const requestDetails = await prisma.request.findMany({
//         where: whereClause,
//         select: {
//             id: true,
//             selectedSection: true,
//             missionBlock: true,
//             divisionId: true,
//             demandTimeFrom: true,
//             demandTimeTo: true,
//             status: true,
//             corridorType: true,
//             sanctionedTimeFrom: true,
//             sanctionedTimeTo: true,
//             AvailedTimeFrom: true,
//             AvailedTimeTo: true,
//             grantedFromTime: true,
//             grantedToTime: true,
//             isSanctioned: true,
//             overAllStatus: true,
//             activity: true, // Include activity for detailed report
//             user: {
//                 select: {
//                     location: true,
//                 },
//             },
//         },
//     });

//     // 3. Fetch data for detailed report (using same filters)
//     const requestDetailsForReport = await prisma.request.findMany({
//         where: whereClause,
//         orderBy: { date: "asc" },
//         select: {
//             id: true,
//             date: true,
//             selectedSection: true,
//             divisionId: true,
//             missionBlock: true,
//             demandTimeFrom: true,
//             demandTimeTo: true,
//             corridorType: true,
//             status: true,
//             overAllStatus: true, // Assuming this is the same as status
//             activity: true, // Include activity for detailed report
//             user: {
//                 select: {
//                     location: true,
//                 },
//             },
//         },
//     });

//     // 4. Group requests by location for summary
//     const requestsByLocation = {};
//     requestDetails.forEach((req) => {
//         const location = req.user?.location || "Unknown";
//         if (!requestsByLocation[location]) {
//             requestsByLocation[location] = [];
//         }
//         requestsByLocation[location].push(req);
//     });

//     // 5. Calculate metrics per location
//     const pastBlockSummary = Object.entries(requestsByLocation).map(
//         ([location, locationRequests]) => {
//             let totalDemanded = 0;
//             let totalSanctioned = 0;
//             let totalGranted = 0;
//             let totalAvailed = 0;

//             locationRequests.forEach((req) => {
//                 // Calculate demanded hours
//                 const demandedHours =
//                     (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) / (1000 * 60 * 60);
//                 totalDemanded += demandedHours < 0 ? demandedHours + 24 : demandedHours;

//                 // Calculate sanctioned hours (if available)
//                 if (req.isSanctioned && req.sanctionedTimeFrom && req.sanctionedTimeTo) {
//                     const sanctionedHours =
//                         (new Date(req.sanctionedTimeTo) - new Date(req.sanctionedTimeFrom)) /
//                         (1000 * 60 * 60);
//                     totalSanctioned += sanctionedHours < 0 ? sanctionedHours + 24 : sanctionedHours;
//                 }

//                 // Calculate granted hours (if available)
//                 if (req.grantedFromTime && req.grantedToTime) {
//                     const grantedHours =
//                         (new Date(req.grantedToTime) - new Date(req.grantedFromTime)) /
//                         (1000 * 60 * 60);
//                     totalGranted += grantedHours < 0 ? grantedHours + 24 : grantedHours;
//                 }

//                 // Calculate availed hours (if available)
//                 if (req.AvailedTimeFrom && req.AvailedTimeTo) {
//                     const availedHours =
//                         (new Date(req.AvailedTimeTo) - new Date(req.AvailedTimeFrom)) /
//                         (1000 * 60 * 60);
//                     totalAvailed += availedHours < 0 ? availedHours + 24 : availedHours;
//                 }
//             });

//             // Calculate percentages
//             const percentSanctioned = totalDemanded ? (totalSanctioned / totalDemanded) * 100 : 0;
//             const percentGranted = totalDemanded ? (totalGranted / totalDemanded) * 100 : 0;
//             const percentAvailed = totalSanctioned ? (totalAvailed / totalSanctioned) * 100 : 0;

//             return {
//                 Department: location,
//                 TotalRequests: locationRequests.length,
//                 Demanded: parseFloat(totalDemanded.toFixed(2)),
//                 Approved: parseFloat(totalSanctioned.toFixed(2)),
//                 Granted: parseFloat(totalGranted.toFixed(2)),
//                 PercentGranted: parseFloat(percentGranted.toFixed(2)),
//                 Availed: parseFloat(totalAvailed.toFixed(2)),
//                 PercentAvailed: parseFloat(percentAvailed.toFixed(2)),
//             };
//         },
//     );

//     // 6. Prepare detailed data (only for selected locations)
//     const detailedData = requestDetailsForReport.map((req) => ({
//         id: req.id,
//         Date: new Date(req.date).toLocaleDateString(),
//         Section: req.selectedSection,
//         MissionBlock: req.missionBlock,
//         DivisionId: req.divisionId,
//         Location: req.user?.location || "Unknown",
//         Duration: (
//             (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) /
//             (1000 * 60 * 60)
//         ).toFixed(2),
//         Type: req.corridorType,
//         Status: req.status,
//         overAllStatus: req.overAllStatus, // Assuming this is the same as status
//         Activity: req.activity, // Include activity for detailed report
//     }));

//     return {
//         pastBlockSummary,
//         detailedData,
//     };
// };
export const generateDrmReport = async (
    startDate,
    endDate,
    majorSections,
    departments,
    blockTypes,
    locations,
) => {
    // 1. Build filters array
    const filters = [];

    // Date filter
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

    // Department filter
    if (departments && departments.length > 0) {
        const mappedDepartments = departments.map((dept) => {
            if (dept === "Engineering") return "ENGG";
            if (dept === "ST") return "S&T";
            return dept;
        });

        filters.push({
            selectedDepartment: { in: mappedDepartments },
        });
    }

    // Block type filter
    if (
        blockTypes &&
        blockTypes.length > 0 &&
        !blockTypes.some((bt) => bt.toUpperCase() === "ALL")
    ) {
        const mappedBlockTypes = blockTypes.map((blockType) => {
            if (blockType === "Non-corridor") return "Outside Corridor";
            if (blockType === "Emergency") return "Urgent Block";
            if (blockType === "Corridor") return "Corridor";
            return blockType;
        });

        filters.push({
            corridorType: { in: mappedBlockTypes },
        });
    }

    // Normalize locations to uppercase to handle "All"
    const normalizedLocations = locations.map((loc) => loc.toUpperCase());

    // Location filter
    let locationFilter = {};
    if (normalizedLocations.length > 0 && !normalizedLocations.includes("ALL")) {
        locationFilter = {
            user: { location: { in: normalizedLocations } },
        };
    }

    // Combine filters
    const whereClause =
        filters.length > 0
            ? normalizedLocations.includes("ALL")
                ? { AND: filters } // no location filter
                : { AND: [...filters, locationFilter] }
            : locationFilter;

    console.log("Final WHERE clause:", JSON.stringify(whereClause, null, 2));

    // 2. Fetch historical data
    const requestDetails = await prisma.request.findMany({
        where: whereClause,
        select: {
            id: true,
            selectedSection: true,
            missionBlock: true,
            divisionId: true,
            demandTimeFrom: true,
            demandTimeTo: true,
            status: true,
            corridorType: true,
            sanctionedTimeFrom: true,
            sanctionedTimeTo: true,
            AvailedTimeFrom: true,
            AvailedTimeTo: true,
            grantedFromTime: true,
            grantedToTime: true,
            isSanctioned: true,
            overAllStatus: true,
            activity: true,
            user: { select: { location: true } },
        },
    });

    // 3. Fetch detailed report data
    const requestDetailsForReport = await prisma.request.findMany({
        where: whereClause,
        orderBy: { date: "asc" },
        select: {
            id: true,
            date: true,
            selectedSection: true,
            divisionId: true,
            missionBlock: true,
            demandTimeFrom: true,
            demandTimeTo: true,
            corridorType: true,
            status: true,
            overAllStatus: true,
            activity: true,
            user: { select: { location: true } },
        },
    });

    // 4. Group requests by location
    const requestsByLocation = {};
    requestDetails.forEach((req) => {
        const location = req.user?.location || "Unknown";
        if (!requestsByLocation[location]) requestsByLocation[location] = [];
        requestsByLocation[location].push(req);
    });

    // 5. Calculate summary metrics per location
    const pastBlockSummary = Object.entries(requestsByLocation).map(
        ([location, locationRequests]) => {
            let totalDemanded = 0;
            let totalSanctioned = 0;
            let totalGranted = 0;
            let totalAvailed = 0;

            locationRequests.forEach((req) => {
                const demandedHours =
                    (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) / (1000 * 60 * 60);
                totalDemanded += demandedHours < 0 ? demandedHours + 24 : demandedHours;

                if (req.isSanctioned && req.sanctionedTimeFrom && req.sanctionedTimeTo) {
                    const sanctionedHours =
                        (new Date(req.sanctionedTimeTo) - new Date(req.sanctionedTimeFrom)) /
                        (1000 * 60 * 60);
                    totalSanctioned += sanctionedHours < 0 ? sanctionedHours + 24 : sanctionedHours;
                }

                if (req.grantedFromTime && req.grantedToTime) {
                    const grantedHours =
                        (new Date(req.grantedToTime) - new Date(req.grantedFromTime)) /
                        (1000 * 60 * 60);
                    totalGranted += grantedHours < 0 ? grantedHours + 24 : grantedHours;
                }

                if (req.AvailedTimeFrom && req.AvailedTimeTo) {
                    const availedHours =
                        (new Date(req.AvailedTimeTo) - new Date(req.AvailedTimeFrom)) /
                        (1000 * 60 * 60);
                    totalAvailed += availedHours < 0 ? availedHours + 24 : availedHours;
                }
            });

            const percentSanctioned = totalDemanded ? (totalSanctioned / totalDemanded) * 100 : 0;
            const percentGranted = totalDemanded ? (totalGranted / totalDemanded) * 100 : 0;
            const percentAvailed = totalSanctioned ? (totalAvailed / totalSanctioned) * 100 : 0;

            return {
                Department: location,
                TotalRequests: locationRequests.length,
                Demanded: parseFloat(totalDemanded.toFixed(2)),
                Approved: parseFloat(totalSanctioned.toFixed(2)),
                Granted: parseFloat(totalGranted.toFixed(2)),
                PercentGranted: parseFloat(percentGranted.toFixed(2)),
                Availed: parseFloat(totalAvailed.toFixed(2)),
                PercentAvailed: parseFloat(percentAvailed.toFixed(2)),
            };
        },
    );

    // 6. Prepare detailed data
    const detailedData = requestDetailsForReport.map((req) => ({
        id: req.id,
        Date: new Date(req.date).toLocaleDateString(),
        Section: req.selectedSection,
        MissionBlock: req.missionBlock,
        DivisionId: req.divisionId,
        Location: req.user?.location || "Unknown",
        Duration: (
            (new Date(req.demandTimeTo) - new Date(req.demandTimeFrom)) /
            (1000 * 60 * 60)
        ).toFixed(2),
        Type: req.corridorType,
        Status: req.status,
        overAllStatus: req.overAllStatus,
        Activity: req.activity,
    }));

    return {
        pastBlockSummary,
        detailedData,
    };
};
