import prisma from "../prisma/index.js";
import { Prisma } from "@prisma/client";
import * as notificationService from "./notification.service.js";

/**
 * Calculate the overall status based on the request flow
 * @param {Object} request - The request object with all relevant fields
 * @param {string} userDepartment - Optional department for rejection context (S&T, TRD)
 * @returns {string} - The calculated overall status
 */
export const calculateOverallStatus = (request, userDepartment = null) => {
    const {
        isSanctioned,
        userAcceptanceForSanction,
        managerAcceptance,
        adminAcceptance,
        allSntAcceptance,
        allTrdAcceptance,
        allEnggAcceptance,
        sntDisconnectionRequired,
        powerBlockRequired,
        enggDisconnectionsRequired,
        optimizeStatus,
        remarkByManager,
        disconnectionRequestRejectRemarks,
        adminRequestStatus,
        remark,
    } = request;
    const remarkValue = remark || "";

    // Final state: User has accepted the sanctioned request
    if (isSanctioned && userAcceptanceForSanction && remarkValue === "") {
        return "Sanctioned and Accepted by SSE";
    }
    if (isSanctioned && userAcceptanceForSanction === false && remarkValue !== "") {
        return "Sanctioned and Rejected by SSE";
    }
    // Request is sanctioned but waiting for user acceptance
    if (isSanctioned && !userAcceptanceForSanction) {
        return "Sanctioned, Pending with SSE For Acceptance";
    }

    // Check for rejection scenarios
    if (remarkByManager && managerAcceptance === false) {
        return "return to applicant by Dept controller.";
    }

    if (remarkByManager && adminAcceptance === false && adminRequestStatus === "REJECTED") {
        return "return to applicant by optg";
    }

    if (disconnectionRequestRejectRemarks && disconnectionRequestRejectRemarks.trim() !== "") {
        // Determine which department rejected based on userDepartment context
        if (userDepartment === "S&T") {
            return "return to applicant by S&T disconnection";
        } else if (userDepartment === "TRD") {
            return "return to applicant by TRD disconnection";
        } else if (userDepartment === "ENGG") {
            return "return to applicant by ENGG disconnection";
        }
        return "return to applicant by disconnection";
    }

    // If manager hasn't accepted yet, show all pending approvals
    if (!managerAcceptance) {
        const statusParts = ["Dept Controller"];

        if (sntDisconnectionRequired && allSntAcceptance !== "ACCEPTED") {
            statusParts.push("S&T");
        }

        if (enggDisconnectionsRequired && allEnggAcceptance !== "ACCEPTED") {
            statusParts.push("ENGG");
        }
        if (powerBlockRequired && allTrdAcceptance !== "ACCEPTED") {
            statusParts.push("TRD");
        }

        return `with ${statusParts.join(" and ")}`;
    }

    // Manager has accepted, check if admin has accepted
    if (
        managerAcceptance &&
        adminAcceptance === false &&
        sntDisconnectionRequired &&
        allSntAcceptance === "ACCEPTED" &&
        (enggDisconnectionsRequired === false ||
            (enggDisconnectionsRequired && allEnggAcceptance === "ACCEPTED")) &&
        (powerBlockRequired === false || (powerBlockRequired && allTrdAcceptance === "ACCEPTED")) &&
        adminRequestStatus !== "REJECTED" &&
        adminRequestStatus !== "APPROVED"
    ) {
        return "with optg";
    }

    if (
        managerAcceptance &&
        adminAcceptance === false &&
        enggDisconnectionsRequired &&
        allEnggAcceptance === "ACCEPTED" &&
        (sntDisconnectionRequired === false ||
            (sntDisconnectionRequired && allSntAcceptance === "ACCEPTED")) &&
        (powerBlockRequired === false || (powerBlockRequired && allTrdAcceptance === "ACCEPTED")) &&
        adminRequestStatus !== "REJECTED" &&
        adminRequestStatus !== "APPROVED"
    ) {
        return "with optg";
    }

    if (
        managerAcceptance &&
        adminAcceptance === false &&
        powerBlockRequired &&
        allTrdAcceptance === "ACCEPTED" &&
        (sntDisconnectionRequired === false ||
            (sntDisconnectionRequired && allSntAcceptance === "ACCEPTED")) &&
        (enggDisconnectionsRequired === false ||
            (enggDisconnectionsRequired && allEnggAcceptance === "ACCEPTED")) &&
        adminRequestStatus !== "REJECTED" &&
        adminRequestStatus !== "APPROVED"
    ) {
        return "with optg";
    }
    if (
        managerAcceptance &&
        adminAcceptance === false &&
        powerBlockRequired === false &&
        sntDisconnectionRequired === false &&
        enggDisconnectionsRequired === false &&
        adminRequestStatus !== "REJECTED" &&
        adminRequestStatus !== "APPROVED"
    ) {
        return "with optg";
    }

    // Manager has accepted, now check what disconnections are still pending
    if (managerAcceptance) {
        const pendingDepartments = [];

        if (sntDisconnectionRequired && allSntAcceptance !== "ACCEPTED") {
            pendingDepartments.push("S&T");
        }
        if (enggDisconnectionsRequired && allEnggAcceptance !== "ACCEPTED") {
            pendingDepartments.push("ENGG");
        }

        if (powerBlockRequired && allTrdAcceptance !== "ACCEPTED") {
            pendingDepartments.push("TRD");
        }

        // If there are still pending disconnections
        if (pendingDepartments.length > 0) {
            return `with ${pendingDepartments.join(" and ")} disconnection.`;
        }

        // All disconnections are accepted or not required, ready for optimization
        if (!isSanctioned && !optimizeStatus) {
            return "with optg.";
        }
    }

    // Default fallback
    return "PENDING";
};

// export const createRequest = async (data, userId,location) => {
//     // Create a list of allowed fields from the Prisma schema
//     const allowedFields = [
//         "adminAcceptance",
//         "date",
//         "selectedDepartment",
//         "selectedSection",
//         "stationID",
//         "missionBlock",
//         "workType",
//         "activity",
//         "freshCautionRequired",
//         "freshCautionSpeed",
//         "freshCautionLocationFrom",
//         "freshCautionLocationTo",
//         "adjacentLinesAffected",
//         "workLocationFrom",
//         "workLocationTo",
//         "demandTimeFrom",
//         "demandTimeTo",
//         "sigDisconnection",
//         "elementarySection",
//         "elementarySectionTo",
//         "sigElementarySectionFrom",
//         "sigElementarySectionTo",
//         "repercussions",
//         "trdWorkLocation",
//         "requestremarks",
//         "status",
//         "selectedDepo",
//         "sigResponse",
//         "ohDisconnection",
//         "oheDisconnection",
//         "oheResponse",
//         "corridorType",
//         "corridorTypeSelection",
//         "sigActionsNeeded",
//         "trdActionsNeeded",
//         "ManagerResponse",
//         "sigDisconnectionRequirements",
//         "sntDisconnectionRequirements",
//         "sntDisconnectionLine",
//         "sntDisconnectionLineFrom",
//         "sntDisconnectionLineTo",
//         "trdDisconnectionRequirements",
//         "powerBlockRequirements",
//         "powerBlockRequired",
//         "sntDisconnectionRequired",
//         "processedLineSections",
//         "routeFrom",
//         "routeTo",
//         "DisconnAcceptance",
//         "managerAcceptanceId",
//         "managerAcceptance",
//         "adminAcceptanceId",
//         "sntDisconnectionAssignTo",
//         "trdDisconnectionAssignTo",
//         "workNature",
//     ];

//     // Filter out any fields that aren't in the allowedFields list
//     const filteredData = Object.fromEntries(
//         Object.entries(data).filter(([key]) => allowedFields.includes(key)),
//     );

//     return await prisma.request.create({
//         data: {
//             ...filteredData,
//             userId,
//             status: "PENDING",
//         },
//     });
// };

// export const createRequest = async (data, userId, divisionCode) => {
//     try {
//         // List of allowed fields from Prisma schema
//         const allowedFields = [
//             "adminAcceptance",
//             "date",
//             "emergencyBlockRemarks",
//             "selectedDepartment",
//             "selectedSection",
//             "stationID",
//             "missionBlock",
//             "workType",
//             "activity",
//             "freshCautionRequired",
//             "freshCautionSpeed",
//             "freshCautionLocationFrom",
//             "freshCautionLocationTo",
//             "adjacentLinesAffected",
//             "workLocationFrom",
//             "workLocationTo",
//             "demandTimeFrom",
//             "demandTimeTo",
//             "sigDisconnection",
//             "elementarySection",
//             "elementarySectionTo",
//             "sigElementarySectionFrom",
//             "sigElementarySectionTo",
//             "repercussions",
//             "trdWorkLocation",
//             "requestremarks",
//             "status",
//             "selectedDepo",
//             "sigResponse",
//             "ohDisconnection",
//             "oheDisconnection",
//             "oheResponse",
//             "corridorType",
//             "corridorTypeSelection",
//             "sigActionsNeeded",
//             "trdActionsNeeded",
//             "ManagerResponse",
//             "sigDisconnectionRequirements",
//             "sntDisconnectionRequirements",
//             "sntDisconnectionLine",
//             "sntDisconnectionLineFrom",
//             "sntDisconnectionLineTo",
//             "trdDisconnectionRequirements",
//             "powerBlockRequirements",
//             "powerBlockRequired",
//             "sntDisconnectionRequired",
//             "processedLineSections",
//             "routeFrom",
//             "routeTo",
//             "DisconnAcceptance",
//             "managerAcceptanceId",
//             "managerAcceptance",
//             "adminAcceptanceId",
//             "adminAcceptance",
//             "sntDisconnectionAssignTo",
//             "trdDisconnectionAssignTo",
//             "engDisconnectionAssignTo",
//             "workNature",
//             "powerBlockDisconnectionAssignTo",
//             "duration",
//             "isSanctioned",
//             "enggDisconnectionsRequired",
//             "engDisconnectionRemarks",
//             "tpcRemarks",
//             "freshCautionFromDate",
//             "freshCautionToDate",
//             "freshCautionFromTime",
//             "freshCautionToTime",
//         ];

//         // Filter out any fields not in allowedFields
//         const filteredData = Object.fromEntries(
//             Object.entries(data).filter(([key]) => allowedFields.includes(key)),
//         );

//         // 1. Use the exact date from frontend request
//         const requestDate = new Date(data.date);
//         const now = new Date(); // Current timestamp for createdAt
//         const istOffset = 5.5 * 60 * 60 * 1000;
//         const istNow = new Date(now.getTime() + istOffset);

//         // 2. Get last 2 digits of year
//         const yearPart = requestDate.getFullYear().toString().slice(-2);

//         // 3. Convert month to letter (A=Jan, B=Feb, etc., skipping I)
//         const month = requestDate.getMonth();
//         let monthChar = String.fromCharCode(65 + month);
//         if (month >= 8) monthChar = String.fromCharCode(66 + month); // Skip I

//         // 4. Fixed "K"
//         const fixedChar = "K";

//         // 5. Map division code to corresponding letter
//         const divisionMap = {
//             MAS: "A",
//             MDU: "B",
//             SA: "C",
//             PGT: "D",
//             TPJ: "E",
//             TVC: "F",
//         };

//         // Get the base division code (first 3 characters)
//         const baseDivisionCode = divisionCode?.toUpperCase().slice(0, 3) || "GEN";
//         // Get the mapped letter or use original if not in map
//         const divisionLetter = divisionMap[baseDivisionCode] || baseDivisionCode.slice(0, 1);

//         // 6. Calculate date range for current month
//         const startOfMonth = new Date(requestDate.getFullYear(), requestDate.getMonth(), 1);
//         const endOfMonth = new Date(requestDate.getFullYear(), requestDate.getMonth() + 1, 1);

//         // 7. Find most recent request for this month+division
//         // const lastRequest = await prisma.request.findFirst({
//         //     where: {
//         //         createdAt: { lt: istNow }, // Only check requests created before this one
//         //         date: { gte: startOfMonth, lt: endOfMonth },
//         //         divisionId: {
//         //             startsWith: `${yearPart}${monthChar}${fixedChar}${divisionLetter}`,
//         //         },
//         //     },
//         //     orderBy: { createdAt: "desc" }, // Get the newest one
//         // });
//         const lastRequest = await prisma.request.findFirst({
//             where: {
//                 date: { gte: startOfMonth, lt: endOfMonth },
//                 divisionId: {
//                     startsWith: `${yearPart}${monthChar}${fixedChar}${divisionLetter}`,
//                 },
//             },
//             orderBy: { divisionId: "desc" }, // <-- use divisionId, not createdAt
//         });

//         // 8. Determine increment number (now 5 digits)
//         const lastIncrement = lastRequest?.divisionId?.slice(-5) || "00000";
//         const incrementPart = (parseInt(lastIncrement) + 1).toString().padStart(5, "0");

//         // 9. Generate final ID (format: YYMonthKDivisionLetter#####)
//         const divisionId = `${yearPart}${monthChar}${fixedChar}${divisionLetter}${incrementPart}`;

//         // Extras. If any of the isSanctioned and managerAcceptance are true, set sanctioned times and manager response timing
//         if (filteredData.isSanctioned === true) {
//             filteredData.sanctionedTimeFrom = filteredData.demandTimeFrom;
//             filteredData.sanctionedTimeTo = filteredData.demandTimeTo;
//             // filteredData.DisconnAcceptance = "ACCEPTED";
//             // filteredData.sigActionsNeeded = true;
//             // filteredData.trdActionsNeeded = true;
//             filteredData.allSntAcceptance = true;
//             filteredData.allTrdAcceptance = true;
//             filteredData.allEnggAcceptance = true;
//             filteredData.managerAcceptance = true;
//             filteredData.managerAcceptanceId = "System";
//             filteredData.adminAcceptance = true;
//             filteredData.adminAcceptanceId = "System";
//             filteredData.optimizeStatus = true;
//             filteredData.userAcceptanceForSanction = true;
//         }

//         if (filteredData.managerAcceptance === true) {
//             filteredData.managerResponseTiming = istNow;
//         }

//         // Calculate overall status using the common function
//         const overAllStatus = calculateOverallStatus({
//             isSanctioned: filteredData.isSanctioned,
//             userAcceptanceForSanction: filteredData.userAcceptanceForSanction,
//             managerAcceptance: filteredData.managerAcceptance,
//             adminAcceptance: filteredData.adminAcceptance,
//             allSntAcceptance: filteredData.allSntAcceptance ? "ACCEPTED" : "PENDING",
//             allTrdAcceptance: filteredData.allTrdAcceptance ? "ACCEPTED" : "PENDING",
//             allEnggAcceptance: filteredData.allEnggAcceptance ? "ACCEPTED" : "PENDING",
//             sntDisconnectionRequired: filteredData.sntDisconnectionRequired,
//             enggDisconnectionsRequired: filteredData.enggDisconnectionsRequired,
//             powerBlockRequired: filteredData.powerBlockRequired,
//             optimizeStatus: filteredData.optimizeStatus,
//             remarkByManager: null,
//             disconnectionRequestRejectRemarks: null,
//         });

//         // 10. Create the request with generated ID and disconnection records
//         const createdRequest = await prisma.$transaction(async (prisma) => {
//             // Create the main request
//             const request = await prisma.request.create({
//                 data: {
//                     ...filteredData,
//                     userId,
//                     status: filteredData.isSanctioned ? "APPROVED" : "PENDING",
//                     divisionId,
//                     overAllStatus,
//                     createdAt: now,
//                 },
//             });
//             if (filteredData.enggDisconnectionsRequired && filteredData.engDisconnectionAssignTo) {
//                 // Split the depot string by comma and process each depot
//                 const sntDepots = filteredData.engDisconnectionAssignTo
//                     .split(",")
//                     .map((depot) => depot.trim())
//                     .filter((depot) => depot.length > 0);

//                 for (const depot of sntDepots) {
//                     await prisma.enggDisconnection.create({
//                         data: {
//                             requestId: request.id,
//                             depot: depot,
//                             status: "PENDING",
//                         },
//                     });
//                 }
//             }
//             // Create S&T disconnections if required
//             if (filteredData.sntDisconnectionRequired && filteredData.sntDisconnectionAssignTo) {
//                 // Split the depot string by comma and process each depot
//                 const sntDepots = filteredData.sntDisconnectionAssignTo
//                     .split(",")
//                     .map((depot) => depot.trim())
//                     .filter((depot) => depot.length > 0);

//                 for (const depot of sntDepots) {
//                     await prisma.sntDisconnection.create({
//                         data: {
//                             requestId: request.id,
//                             depot: depot,
//                             status: "PENDING",
//                         },
//                     });
//                 }
//             }

//             // Create TRD disconnections if required
//             if (filteredData.powerBlockRequired && filteredData.powerBlockDisconnectionAssignTo) {
//                 // Split the depot string by comma and process each depot
//                 const trdDepots = filteredData.powerBlockDisconnectionAssignTo
//                     .split(",")
//                     .map((depot) => depot.trim())
//                     .filter((depot) => depot.length > 0);

//                 for (const depot of trdDepots) {
//                     await prisma.trdDisconnection.create({
//                         data: {
//                             requestId: request.id,
//                             depot: depot,
//                             status: "PENDING",
//                         },
//                     });
//                 }
//             }

//             return request;
//         });

//         // Notify all USERs in selectedSection depot
//         try {
//             await notificationService.notifyUsersInSelectedSection(createdRequest);
//         } catch (notificationError) {
//             console.error("Failed to notify users in selectedSection depot:", notificationError);
//         }

//         // Notify DEPT_CONTROLLERs for S&T/TRD disconnections if required
//         try {
//             await notificationService.notifyDeptControllersForDisconnections(createdRequest);
//         } catch (notificationError) {
//             console.error(
//                 "Failed to notify DEPT_CONTROLLERs for disconnections:",
//                 notificationError,
//             );
//         }

//         // Notify DEPT_CONTROLLER for urgent requests
//         if (filteredData.corridorType === "Urgent Block") {
//             try {
//                 await notificationService.notifyDeptControllerForUrgentRequest(createdRequest);
//             } catch (notificationError) {
//                 console.error("Failed to send notification:", notificationError);
//             }
//         }

//         return createdRequest;
//     } catch (error) {
//         console.log(error);
//         throw error;
//     }
// };
export const createRequest = async (data, userId, divisionCode) => {
    try {
        const allowedFields = [
            "adminAcceptance",
            "date",
            "emergencyBlockRemarks",
            "selectedDepartment",
            "selectedSection",
            "stationID",
            "missionBlock",
            "workType",
            "activity",
            "freshCautionRequired",
            "freshCautionSpeed",
            "freshCautionLocationFrom",
            "freshCautionLocationTo",
            "adjacentLinesAffected",
            "workLocationFrom",
            "workLocationTo",
            "demandTimeFrom",
            "demandTimeTo",
            "sigDisconnection",
            "elementarySection",
            "elementarySectionTo",
            "sigElementarySectionFrom",
            "sigElementarySectionTo",
            "repercussions",
            "trdWorkLocation",
            "requestremarks",
            "status",
            "selectedDepo",
            "sigResponse",
            "ohDisconnection",
            "oheDisconnection",
            "oheResponse",
            "corridorType",
            "corridorTypeSelection",
            "sigActionsNeeded",
            "trdActionsNeeded",
            "ManagerResponse",
            "sigDisconnectionRequirements",
            "sntDisconnectionRequirements",
            "sntDisconnectionLine",
            "sntDisconnectionLineFrom",
            "sntDisconnectionLineTo",
            "trdDisconnectionRequirements",
            "powerBlockRequirements",
            "powerBlockRequired",
            "sntDisconnectionRequired",
            "processedLineSections",
            "routeFrom",
            "routeTo",
            "DisconnAcceptance",
            "managerAcceptanceId",
            "managerAcceptance",
            "adminAcceptanceId",
            "adminAcceptance",
            "sntDisconnectionAssignTo",
            "trdDisconnectionAssignTo",
            "engDisconnectionAssignTo",
            "workNature",
            "powerBlockDisconnectionAssignTo",
            "duration",
            "isSanctioned",
            "enggDisconnectionsRequired",
            "engDisconnectionRemarks",
            "tpcRemarks",
            "freshCautions",
            "assetNumber",
            "assetName",
        ];

        const filteredData = Object.fromEntries(
            Object.entries(data).filter(([key]) => allowedFields.includes(key)),
        );

        // ✅ Store freshCautions array as JSON (if exists)
        if (data.freshCautions && Array.isArray(data.freshCautions)) {
            filteredData.freshCautions = data.freshCautions;
        }

        const requestDate = new Date(data.date);
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffset);
        const yearPart = requestDate.getFullYear().toString().slice(-2);
        const month = requestDate.getMonth();
        let monthChar = String.fromCharCode(65 + month);
        if (month >= 8) monthChar = String.fromCharCode(66 + month);
        const fixedChar = "K";
        const divisionMap = { MAS: "A", MDU: "B", SA: "C", PGT: "D", TPJ: "E", TVC: "F" };
        const baseDivisionCode = divisionCode?.toUpperCase().slice(0, 3) || "GEN";
        const divisionLetter = divisionMap[baseDivisionCode] || baseDivisionCode.slice(0, 1);
        const startOfMonth = new Date(requestDate.getFullYear(), requestDate.getMonth(), 1);
        const endOfMonth = new Date(requestDate.getFullYear(), requestDate.getMonth() + 1, 1);

        const lastRequest = await prisma.request.findFirst({
            where: {
                date: { gte: startOfMonth, lt: endOfMonth },
                divisionId: { startsWith: `${yearPart}${monthChar}${fixedChar}${divisionLetter}` },
            },
            orderBy: { divisionId: "desc" },
        });

        const lastIncrement = lastRequest?.divisionId?.slice(-5) || "00000";
        const incrementPart = (parseInt(lastIncrement) + 1).toString().padStart(5, "0");
        const divisionId = `${yearPart}${monthChar}${fixedChar}${divisionLetter}${incrementPart}`;

        if (filteredData.isSanctioned === true) {
            filteredData.sanctionedTimeFrom = filteredData.demandTimeFrom;
            filteredData.sanctionedTimeTo = filteredData.demandTimeTo;
            filteredData.allSntAcceptance = "ACCEPTED";
            filteredData.allTrdAcceptance = "ACCEPTED";
            filteredData.allEnggAcceptance = "ACCEPTED";
            filteredData.managerAcceptance = true;
            filteredData.managerAcceptanceId = "System";
            filteredData.adminAcceptance = true;
            filteredData.adminAcceptanceId = "System";
            filteredData.optimizeStatus = true;
            filteredData.userAcceptanceForSanction = true;
        }

        if (filteredData.managerAcceptance === true) {
            filteredData.managerResponseTiming = istNow;
        }

        const overAllStatus = calculateOverallStatus({
            isSanctioned: filteredData.isSanctioned,
            userAcceptanceForSanction: filteredData.userAcceptanceForSanction,
            managerAcceptance: filteredData.managerAcceptance,
            adminAcceptance: filteredData.adminAcceptance,
            allSntAcceptance: filteredData.allSntAcceptance ? "ACCEPTED" : "PENDING",
            allTrdAcceptance: filteredData.allTrdAcceptance ? "ACCEPTED" : "PENDING",
            allEnggAcceptance: filteredData.allEnggAcceptance ? "ACCEPTED" : "PENDING",
            sntDisconnectionRequired: filteredData.sntDisconnectionRequired,
            enggDisconnectionsRequired: filteredData.enggDisconnectionsRequired,
            powerBlockRequired: filteredData.powerBlockRequired,
            optimizeStatus: filteredData.optimizeStatus,
        });

        const createdRequest = await prisma.$transaction(async (prisma) => {
            const request = await prisma.request.create({
                data: {
                    ...filteredData,
                    userId,
                    status: filteredData.isSanctioned ? "APPROVED" : "PENDING",
                    divisionId,
                    overAllStatus,
                    createdAt: istNow,
                },
            });

            if (filteredData.enggDisconnectionsRequired && filteredData.engDisconnectionAssignTo) {
                const sntDepots = filteredData.engDisconnectionAssignTo
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean);

                for (const depot of sntDepots) {
                    await prisma.enggDisconnection.create({
                        data: { requestId: request.id, depot, status: "PENDING" },
                    });
                }
            }

            if (filteredData.sntDisconnectionRequired && filteredData.sntDisconnectionAssignTo) {
                const sntDepots = filteredData.sntDisconnectionAssignTo
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean);

                for (const depot of sntDepots) {
                    await prisma.sntDisconnection.create({
                        data: { requestId: request.id, depot, status: "PENDING" },
                    });
                }
            }

            if (filteredData.powerBlockRequired && filteredData.powerBlockDisconnectionAssignTo) {
                const trdDepots = filteredData.powerBlockDisconnectionAssignTo
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean);

                for (const depot of trdDepots) {
                    await prisma.trdDisconnection.create({
                        data: { requestId: request.id, depot, status: "PENDING" },
                    });
                }
            }

            return request;
        });

        try {
            await notificationService.notifyUsersInSelectedSection(createdRequest);
        } catch {}
        try {
            await notificationService.notifyDeptControllersForDisconnections(createdRequest);
        } catch {}
        if (filteredData.corridorType === "Urgent Block") {
            try {
                await notificationService.notifyDeptControllerForUrgentRequest(createdRequest);
            } catch {}
        }

        return createdRequest;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const updatedSatus = async (requestId, status, reason) => {
    const updatedRequest = await prisma.request.update({
        where: { id: requestId },
        data: {
            userStatus: status,
            reasonForReject: reason,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!updatedRequest) throw new Error("Request not found or update failed");
    return updatedRequest;
};
export const userResponse = async (requestId, userResponse, reason) => {
    const updatedRequest = await prisma.request.update({
        where: { id: requestId },
        data: {
            userResponse: userResponse,
            availedResponse: reason,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!updatedRequest) throw new Error("Request not found or update failed");
    return updatedRequest;
};

export const updateOptimizeTimes = async (requestId, optimizeTimeFrom, optimizeTimeTo, date) => {
    const updatedRequest = await prisma.Optimize_Table.update({
        where: { id: requestId },
        data: {
            optimizeTimeFrom,
            optimizeTimeTo,
            date,
            isEdited: true,
        },
    });

    if (!updatedRequest) throw new Error("Request not found or update failed");
    return updatedRequest;
};

// export const editRequest = async (id, updateData) => {
//   // Convert to Prisma-compatible format
//   const prismaUpdateData = {};

//   if (updateData.optimizeTimeFrom !== undefined) {
//     prismaUpdateData.optimizeTimeFrom = updateData.optimizeTimeFrom;
//   }

//   if (updateData.optimizeTimeTo !== undefined) {
//     prismaUpdateData.optimizeTimeTo = updateData.optimizeTimeTo;
//   }

//   if (updateData.date !== undefined) {
//     prismaUpdateData.date = updateData.date;
//   }
//   const updatedRequest = await prisma.request.update({
//     where: { id },
//     data: prismaUpdateData,
//   });

//   if (!updatedRequest) {
//     throw new Error("Request not found or update failed");
//   }

//   return updatedRequest;
// };

export const editRequest = async (
    requestId,
    optimizeTimeFrom,
    optimizeTimeTo,
    date,
    mobileView,
    sanctionedRemark,
) => {
    const updatedRequest = await prisma.request.update({
        where: { id: requestId },
        data: {
            optimizeTimeFrom,
            optimizeTimeTo,
            date,
            optimizeStatus: true,
            sanctionedRemarks: sanctionedRemark || null,
            // ...(mobileView && { isSanctioned: true }),
        },
    });

    if (!updatedRequest) throw new Error("Request not found or update failed");
    return updatedRequest;
};

// In your service file
// export const updateSanctionStatus = async (requests) => {
//     try {
//         return await prisma.$transaction(
//             requests.map((request) =>
//                 prisma.Request.update({
//                     where: { id: request.id },
//                     data: {
//                         isSanctioned: true,

//                         sanctionedTimeFrom: request.optimizeTimeFrom,
//                         sanctionedTimeTo: request.optimizeTimeTo,
//                     },
//                 }),
//             ),
//         );
//     } catch (error) {
//         console.error("Database error in updateSanctionStatus:", error);
//         throw new Error("Failed to update records in database");
//     }
// };
export const updateSanctionStatus = async (requests) => {
    try {
        // 1. Fetch current optimizeStatus for all request IDs
        const requestIds = requests.map((r) => r.id);

        const existingRequests = await prisma.request.findMany({
            where: { id: { in: requestIds } },
            select: {
                id: true,
                optimizeStatus: true,
            },
        });

        const optimizeStatusMap = new Map();
        for (const req of existingRequests) {
            optimizeStatusMap.set(req.id, req.optimizeStatus);
        }

        // 2. Create update operations with conditionally set overAllStatus
        const updates = requests.map((request) => {
            const isOptimized = optimizeStatusMap.get(request.id);

            // Calculate new overall status for sanctioned requests
            const overAllStatus = calculateOverallStatus({
                isSanctioned: true,
                userAcceptanceForSanction: false, // Not yet accepted by user
                managerAcceptance: true, // Must be true to reach sanctioning
                adminAcceptance: true, // Must be true to reach sanctioning
                allSntAcceptance: "ACCEPTED", // Must be accepted to reach sanctioning
                allTrdAcceptance: "ACCEPTED", // Must be accepted to reach sanctioning
                sntDisconnectionRequired: false, // Not relevant at this stage
                powerBlockRequired: false, // Not relevant at this stage
                optimizeStatus: isOptimized,
                remarkByManager: null,
                disconnectionRequestRejectRemarks: null,
            });

            return prisma.request.update({
                where: { id: request.id },
                data: {
                    isSanctioned: true,
                    sanctionedTimeFrom: request.optimizeTimeFrom,
                    sanctionedTimeTo: request.optimizeTimeTo,
                    ...(isOptimized && { overAllStatus }),
                    sanctionedRemarks: request.sanctionedRemark || null,
                },
            });
        });

        // 3. Run all updates in a transaction
        return await prisma.$transaction(updates);
    } catch (error) {
        console.error("Database error in updateSanctionStatus:", error);
        throw new Error("Failed to update records in database");
    }
};
// services/requestService.js
export const updateDraftStatus = async (requests) => {
    try {
        const updates = requests.map((request) => {
            return prisma.request.update({
                where: { id: request.id },
                data: {
                    Draft: true,
                    sanctionedRemarks: request.sanctionedRemark || null,
                },
            });
        });

        return await prisma.$transaction(updates);
    } catch (error) {
        console.error("Database error in updateDraftStatus:", error);
        throw new Error("Failed to update draft status in database");
    }
};
export const deleteOptimizeDataRequest = async (requestId) => {
    try {
        return await prisma.request.delete({
            where: { id: requestId },
        });
    } catch (error) {
        console.error("Database error in deleteOptimizeDataRequest:", error);
        throw error; // Let the controller handle it
    }
};

export const getRequestById = async (id) => {
    const request = await prisma.request.findUnique({
        where: { id },

        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            sntDisconnections: {
                select: {
                    id: true,
                    depot: true,
                    status: true,
                    remarks: true,
                    approvedAt: true,
                },
            },
            trdDisconnections: {
                select: {
                    id: true,
                    depot: true,
                    status: true,
                    remarks: true,
                    approvedAt: true,
                },
            },
            enggDisconnections: {
                select: {
                    id: true,
                    depot: true,
                    status: true,
                    remarks: true,
                    approvedAt: true,
                },
            },
            rejectedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    department: true,
                },
            },
            //     manager: {
            //         select: {
            //             id: true,
            //             name: true,
            //             email: true,
            //             role: true
            //         }
            //     }
        },
    });
    if (!request) throw new Error("Request not found");
    return request;
};

export const updateRequest = async (id, data) => {
    return await prisma.request.update({
        where: { id },
        data,
    });
};

export const deleteRequest = async (id) => {
    return await prisma.request.delete({
        where: { id },
    });
};

export const updateRequestStatus = async (id, status, managerId, ManagerResponse) => {
    return await prisma.request.update({
        where: { id },
        data: {
            status,
            managerId,
            ManagerResponse,
        },
    });
};

export const getUserRequests = async (userId, page = 1, limit = 10, startDate, endDate) => {
    const skip = (page - 1) * limit;

    // First get the current user to determine their role
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            manages: true, // Get users managed by this user
            manager: true, // Get the manager of this user
        },
    });

    if (!currentUser) {
        throw new Error("User not found");
    }

    // Initialize array to collect relevant user IDs
    let userIds = [userId];

    // Handle different roles
    if (currentUser.role === "USER") {
        // If USER: Get all JEs under this user
        if (currentUser.manages && currentUser.manages.length > 0) {
            const jeIds = currentUser.manages
                .filter((user) => user.role === "JE")
                .map((user) => user.id);
            userIds = [...userIds, ...jeIds];
        }
    } else if (currentUser.role === "JE") {
        // If JE: Get manager and fellow JEs under the same manager
        if (currentUser.manager) {
            // Add manager's ID
            userIds.push(currentUser.manager.id);

            // Get all other JEs under the same manager
            const fellowJEs = await prisma.user.findMany({
                where: {
                    managerId: currentUser.manager.id,
                    role: "JE",
                    NOT: {
                        id: userId, // Exclude self
                    },
                },
                select: { id: true },
            });

            // Add fellow JE IDs
            const fellowJEIds = fellowJEs.map((je) => je.id);
            userIds = [...userIds, ...fellowJEIds];
        }
    }

    // If no date range provided, default to next 10 days from today
    const today = new Date();
    const tenDaysLater = new Date();
    tenDaysLater.setDate(today.getDate() + 10);

    const dateFilter =
        startDate && endDate
            ? {
                  date: {
                      gte: new Date(startDate),
                      lte: new Date(endDate),
                  },
              }
            : {
                  date: {
                      gte: today,
                      lte: tenDaysLater,
                  },
              };

    const whereClause = {
        OR: [{ userId: { in: userIds } }, { availedById: { in: userIds } }],
        ...dateFilter,
    };

    const [requests, total] = await Promise.all([
        prisma.request.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        department: true,
                    },
                },
                availedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        department: true,
                    },
                },
            },
        }),
        prisma.request.count({ where: whereClause }),
    ]);

    return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

export const getUserRequestsData = async (userId, page = 1, limit = 30, startDate, endDate) => {
    const skip = (page - 1) * limit;

    const whereClause = {
        userId,
        optimizeStatus: true,
        ...(startDate &&
            endDate && {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            }),
    };

    const [requests, total] = await Promise.all([
        prisma.request.findMany({
            where: whereClause,
            orderBy: { date: "desc" },
            skip,
            take: limit,
        }),
        prisma.request.count({ where: whereClause }),
    ]);

    return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

export const getManagerData = async (userId, page = 1, limit = 30, startDate, endDate) => {
    const skip = (page - 1) * limit;
    const whereClause = {
        userId,
        optimizeStatus: true,
        ...(startDate &&
            endDate && {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            }),
    };

    const [requests, total] = await Promise.all([
        prisma.request.findMany({
            where: whereClause,
            orderBy: { date: "desc" },
            skip,
            take: limit,
        }),
        prisma.request.count({ where: whereClause }),
    ]);

    return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};
export const getManagerRequests = async (managerId, page = 1, limit = 10, startDate, endDate) => {
    const skip = (page - 1) * limit;

    const whereClause = {
        managerId,
        ...(startDate &&
            endDate && {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            }),
    };

    const [requests, total] = await Promise.all([
        prisma.request.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.request.count({ where: whereClause }),
    ]);

    return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

// export const getOtherRequests = async (
//     selectedDepo,
//     page = 1,
//     limit = 10,
//     userEmail,
//     startDate,
//     endDate,
// ) => {
//     const skip = (page - 1) * limit;

//     // Build the where clause
//     const whereClause = {
//         selectedDepo: selectedDepo,
//         OR: [
//             {
//                 sntDisconnectionRequired: true,
//                 // sntDisconnectionAssignTo: userEmail,
//             },
//             {
//                 trdActionsNeeded: true,
//                 // trdDisconnectionAssignTo: userEmail,
//             },
//         ],
//         ...(startDate &&
//             endDate && {
//                 date: {
//                     gte: new Date(startDate),
//                     lte: new Date(endDate),
//                 },
//             }),
//     };

//     const [requests, total] = await Promise.all([
//         prisma.request.findMany({
//             where: whereClause,
//             orderBy: { createdAt: "desc" },
//             skip,
//             take: limit,
//         }),
//         prisma.request.count({
//             where: whereClause,
//         }),
//     ]);

//     return {
//         requests,
//         total,
//         page,
//         totalPages: Math.ceil(total / limit),
//     };
// };

export const getOtherRequests = async (
    selectedDepo,
    page = 1,
    limit = 10,
    startDate,
    endDate,
    userDepartment,
) => {
    const skip = (page - 1) * limit;

    let whereClause = {};
    let includeClause = {
        user: {
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
            },
        },
        availedBy: {
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
            },
        },
    };

    // Query based on department and depot with backward compatibility
    if (userDepartment === "S&T") {
        whereClause = {
            OR: [
                {
                    sntDisconnections: {
                        some: {
                            depot: selectedDepo,
                        },
                    },
                },
                // Backward compatibility
                {
                    AND: [
                        { sntDisconnectionRequired: true },
                        {
                            OR: [{ sntDisconnectionAssignTo: selectedDepo }],
                        },
                    ],
                },
            ],
        };
        includeClause.sntDisconnections = {
            where: {
                depot: selectedDepo,
            },
        };
    } else if (userDepartment === "TRD") {
        whereClause = {
            OR: [
                {
                    trdDisconnections: {
                        some: {
                            depot: selectedDepo,
                        },
                    },
                },
                // Backward compatibility
                {
                    AND: [
                        { powerBlockRequired: true },
                        {
                            OR: [{ powerBlockDisconnectionAssignTo: selectedDepo }],
                        },
                    ],
                },
            ],
        };
        includeClause.trdDisconnections = {
            where: {
                depot: selectedDepo,
            },
        };
    } else if (userDepartment === "ENGG") {
        whereClause = {
            OR: [
                {
                    enggDisconnections: {
                        some: {
                            depot: selectedDepo,
                        },
                    },
                },
                // Backward compatibility
                {
                    AND: [
                        { enggDisconnectionsRequired: true },
                        {
                            OR: [{ engDisconnectionAssignTo: selectedDepo }],
                        },
                    ],
                },
            ],
        };
        includeClause.enggDisconnections = {
            where: {
                depot: selectedDepo,
            },
        };
    }
    // Date filter
    if (startDate && endDate) {
        whereClause.date = {
            gte: new Date(startDate),
            lte: new Date(endDate),
        };
    }
    const [requests, total] = await Promise.all([
        prisma.request.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: includeClause,
        }),
        prisma.request.count({
            where: whereClause,
        }),
    ]);

    return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

// export const updateOtherRequest = async (id, acceptance, disconnectionRequestRejectRemarks) => {
//     console.log(acceptance ? "ACCEPTED" : "REJECTED");
//     return await prisma.request.update({
//         where: { id },
//         data: {
//             DisconnAcceptance: acceptance ? "ACCEPTED" : "REJECTED",
//             disconnectionRequestRejectRemarks: !acceptance
//                 ? disconnectionRequestRejectRemarks
//                 : null,
//         },
//     });
// };

// export const updateOtherRequest = async (
//     id,
//     acceptance,
//     disconnectionRequestRejectRemarks,
//     userDepartment,
//     mobileView,
// ) => {
//     console.log(acceptance ? "ACCEPTED" : "REJECTED");

//     // Base data to update
//     const updateData = {
//         DisconnAcceptance: acceptance ? "ACCEPTED" : "REJECTED",
//         disconnectionRequestRejectRemarks:
//             !acceptance && mobileView !== "mobileView" ? disconnectionRequestRejectRemarks : null,
//     };

//     // Additional updates for mobile view when acceptance is true
//     if (mobileView === "mobileView") {
//         if (userDepartment === "S&T") {
//             updateData.sigActionsNeeded = acceptance;
//             updateData.sigResponse = !acceptance ? disconnectionRequestRejectRemarks : "";
//         } else if (userDepartment === "TRD") {
//             updateData.trdActionsNeeded = acceptance;
//             updateData.oheResponse = !acceptance ? disconnectionRequestRejectRemarks : "";
//         }
//     }

//     return await prisma.request.update({
//         where: { id },
//         data: updateData,
//     });
// };

export const updateOtherRequest = async (
    id,
    acceptance,
    disconnectionRequestRejectRemarks,
    userDepartment,
    depot,
    mobileView,
    location,
    acceptRemarks,
    rejectedByUserId, // Added parameter for the user who is rejecting
) => {
    try {
        const request = await prisma.request.findUnique({
            where: { id },
            select: {
                managerAcceptance: true,
                adminAcceptance: true,
                sigActionsNeeded: true,
                sigResponse: true,
                oheResponse: true,
                trdActionsNeeded: true,
                sntDisconnectionRequired: true,
                enggDisconnectionsRequired: true,
                powerBlockRequired: true,
                remarkByManager: true,
                isSanctioned: true,
                status: true,
                optimizeStatus: true,
                sntAcceptRemarks: true,
                trdAcceptRemarks: true,
                disconnectionRequestRejectRemarks: true,
                sntDisconnections: {
                    select: {
                        id: true,
                        depot: true,
                        status: true,
                    },
                },
                trdDisconnections: {
                    select: {
                        id: true,
                        depot: true,
                        status: true,
                    },
                },
                enggDisconnections: {
                    select: {
                        id: true,
                        depot: true,
                        status: true,
                    },
                },
                allSntAcceptance: true,
                allTrdAcceptance: true,
                allEnggAcceptance: true,
            },
        });

        if (!request) {
            return { ok: false, status: 404, message: "Request not found" };
        }

        // Reject Validation
        if (request.status === "REJECTED") {
            await prisma.request.update({
                where: { id },
                data: {
                    DisconnAcceptance: "REJECTED",
                },
            });
            return { ok: true, status: 208, data: [] };
        }

        let updatedSigActionsNeeded = request.sigActionsNeeded;
        let updatedTrdActionsNeeded = request.trdActionsNeeded;
        let updatedAllTrdAcceptance = request.allTrdAcceptance;
        let updatedAllSntAcceptance = request.allSntAcceptance;
        let updatedAllEnggAcceptance = request.allEnggAcceptance;
        let updatedDisconnectionRejectRemarks = request.disconnectionRequestRejectRemarks;

        const updateData = {};

        // Handle rejection remarks
        if (location === "PGT") {
            updateData.disconnectionRequestRejectRemarks = disconnectionRequestRejectRemarks;
        } else {
            if (!acceptance && mobileView !== "mobileView") {
                updateData.disconnectionRequestRejectRemarks = disconnectionRequestRejectRemarks;
            }
        }

        // Handle department-specific logic with backward compatibility
        if (mobileView === "mobileView") {
            if (userDepartment === "S&T") {
                updatedSigActionsNeeded = acceptance;

                // Update disconnection records if they exist (new format)
                if (request.sntDisconnections && request.sntDisconnections.length > 0) {
                    await prisma.sntDisconnection.updateMany({
                        where: {
                            requestId: id,
                            depot: depot,
                        },
                        data: {
                            status: acceptance ? "ACCEPTED" : "REJECTED",
                            remarks: acceptance
                                ? acceptRemarks || "Approved by S&T"
                                : disconnectionRequestRejectRemarks,
                            approvedAt: acceptance ? new Date() : null,
                        },
                    });
                }

                if (acceptance) {
                    // When S&T accepts, store acceptRemarks in sntAcceptRemarks
                    updateData.sntAcceptRemarks = acceptRemarks || "Approved by S&T";
                } else {
                    updateData.disconnectionRequestRejectRemarks =
                        disconnectionRequestRejectRemarks;
                    updatedDisconnectionRejectRemarks = disconnectionRequestRejectRemarks;
                }

                updateData.sigActionsNeeded = updatedSigActionsNeeded;
            } else if (userDepartment === "TRD") {
                updatedTrdActionsNeeded = acceptance;

                // Update disconnection records if they exist (new format)
                if (request.trdDisconnections && request.trdDisconnections.length > 0) {
                    await prisma.trdDisconnection.updateMany({
                        where: {
                            requestId: id,
                            depot: depot,
                        },
                        data: {
                            status: acceptance ? "ACCEPTED" : "REJECTED",
                            remarks: acceptance
                                ? acceptRemarks || "Approved nby TRD"
                                : disconnectionRequestRejectRemarks,
                            approvedAt: acceptance ? new Date() : null,
                        },
                    });
                }

                if (acceptance) {
                    // When TRD accepts, store acceptRemarks in trdAcceptRemarks
                    updateData.trdAcceptRemarks = acceptRemarks || "Approved by TRD";
                } else {
                    updateData.disconnectionRequestRejectRemarks =
                        disconnectionRequestRejectRemarks;
                    updatedDisconnectionRejectRemarks = disconnectionRequestRejectRemarks;
                }

                updateData.trdActionsNeeded = updatedTrdActionsNeeded;
            } else if (userDepartment === "ENGG") {
                updatedAllEnggAcceptance = acceptance;
                // Update disconnection records if they exist (new format)
                if (request.enggDisconnections && request.enggDisconnections.length > 0) {
                    await prisma.enggDisconnection.updateMany({
                        where: {
                            requestId: id,
                            depot: depot,
                        },
                        data: {
                            status: acceptance ? "ACCEPTED" : "REJECTED",
                            remarks: acceptance
                                ? acceptRemarks || "Approved nby TRD"
                                : disconnectionRequestRejectRemarks,
                            approvedAt: acceptance ? new Date() : null,
                        },
                    });
                }
            }
        }

        // Check if all disconnections are accepted (with backward compatibility)
        let allSntAccepted = true;
        let allTrdAccepted = true;
        let allEnggAcceptance = true;

        // If disconnection records exist, check their status (new format)
        if (request.sntDisconnections && request.sntDisconnections.length > 0) {
            const updatedSntDisconnections = await prisma.sntDisconnection.findMany({
                where: { requestId: id },
                select: { status: true },
            });
            allSntAccepted = updatedSntDisconnections.every((d) => d.status === "ACCEPTED");
            updatedAllSntAcceptance = allSntAccepted ? "ACCEPTED" : "PENDING";
        }

        if (request.trdDisconnections && request.trdDisconnections.length > 0) {
            const updatedTrdDisconnections = await prisma.trdDisconnection.findMany({
                where: { requestId: id },
                select: { status: true },
            });
            allTrdAccepted = updatedTrdDisconnections.every((d) => d.status === "ACCEPTED");
            updatedAllTrdAcceptance = allTrdAccepted ? "ACCEPTED" : "PENDING";
        }
        if (request.enggDisconnections && request.enggDisconnections.length > 0) {
            const updatedEnggDisconnections = await prisma.enggDisconnection.findMany({
                where: { requestId: id },
                select: { status: true },
            });
            allEnggAcceptance = updatedEnggDisconnections.every((d) => d.status === "ACCEPTED");
            updatedAllEnggAcceptance = allEnggAcceptance ? "ACCEPTED" : "PENDING";
        }

        if (
            updatedSigActionsNeeded &&
            updatedTrdActionsNeeded &&
            allSntAccepted &&
            allTrdAccepted &&
            allEnggAcceptance
        ) {
            updateData.DisconnAcceptance = "ACCEPTED";
        }

        // Calculate overall status using the common function
        const overAllStatus = calculateOverallStatus(
            {
                isSanctioned: request.isSanctioned,
                userAcceptanceForSanction: request.userAcceptanceForSanction,
                managerAcceptance: request.managerAcceptance,
                adminAcceptance: request.adminAcceptance,
                allSntAcceptance: updatedAllSntAcceptance,
                allTrdAcceptance: updatedAllTrdAcceptance,
                allEnggAcceptance: updatedAllEnggAcceptance,
                sntDisconnectionRequired: request.sntDisconnectionRequired,
                powerBlockRequired: request.powerBlockRequired,
                optimizeStatus: request.optimizeStatus,
                remarkByManager: request.remarkByManager,
                disconnectionRequestRejectRemarks: updatedDisconnectionRejectRemarks,
            },
            userDepartment,
        );

        // Handle rejection status updates
        if (updatedDisconnectionRejectRemarks && updatedDisconnectionRejectRemarks?.trim() !== "") {
            updateData.DisconnAcceptance = "REJECTED";
            updateData.status = "REJECTED";
            updateData.rejectedById = rejectedByUserId; // Set who rejected the request
        }

        if (overAllStatus) {
            updateData.overAllStatus = overAllStatus;
        }

        // Update the overall acceptance status
        updateData.allSntAcceptance = updatedAllSntAcceptance;
        updateData.allTrdAcceptance = updatedAllTrdAcceptance;
        updateData.allEnggAcceptance = updatedAllEnggAcceptance;

        const updated = await prisma.request.update({
            where: { id },
            data: updateData,
        });
        return { ok: true, status: 200, data: updated };
    } catch (error) {
        console.error("Error in updateOtherRequest:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {
                ok: false,
                status: 500,
                message: "Database error",
                code: error.code,
            };
        }

        return {
            ok: false,
            status: 500,
            message: error.message || "Internal server error",
        };
    }
};

// export const getManagerUsersRequests = async (
//     managerId,
//     role,
//     page = 1,
//     limit,
//     startDate,
//     endDate,
//     status,
//     departement,
// ) => {
//     try {
//         // Validate inputs
//         if (page < 1) throw new Error("Page must be at least 1");
//         if (limit < 1) throw new Error("Limit must be at least 1");

//         const skip = (page - 1) * limit;

//         // Helper to fetch user IDs with a single query
//         const getUserIds = async ({
//             managerId: managerIdCondition,
//             role: targetRole,
//             field = "managerId",
//         }) => {
//             const where = {
//                 [field]: Array.isArray(managerIdCondition)
//                     ? { in: managerIdCondition }
//                     : managerIdCondition,
//             };
//             if (targetRole) where.role = targetRole;

//             const users = await prisma.user.findMany({
//                 where,
//                 select: { id: true },
//             });

//             return users.map((user) => user.id);
//         };

//         // 1. Build the list of USER-IDs under this manager hierarchy
//         let userIds = [];

//         switch (role) {
//             case "BRANCH_OFFICER":
//                 const seniorIds = await getUserIds({ managerId, role: "SENIOR_OFFICER" });
//                 const juniorIds = await getUserIds({
//                     managerId: seniorIds,
//                     role: "JUNIOR_OFFICER",
//                 });
//                 userIds = await getUserIds({ managerId: juniorIds, role: "USER" });
//                 break;

//             case "DEPT_CONTROLLER":
//                 const senior_Ids = await getUserIds({ managerId, role: "SENIOR_OFFICER" });
//                 const junior_Ids = await getUserIds({
//                     managerId: senior_Ids,
//                     role: "JUNIOR_OFFICER",
//                 });
//                 const sse_Ids = await getUserIds({ managerId: junior_Ids, role: "USER" });
//                 const je_Ids = await getUserIds({ managerId: sse_Ids, role: "JE" });
//                 userIds = [...sse_Ids, ...je_Ids];
//                 break;

//             case "SENIOR_OFFICER":
//                 const juniorOfficerIds = await getUserIds({ managerId, role: "JUNIOR_OFFICER" });
//                 userIds = await getUserIds({ managerId: juniorOfficerIds, role: "USER" });
//                 break;

//             case "JUNIOR_OFFICER":
//                 userIds = await getUserIds({ managerId, role: "USER" });
//                 break;

//             default:
//                 throw new Error(`Role ${role} is not supported for this endpoint`);
//         }

//         // Early return if no users found
//         if (userIds.length === 0) {
//             return {
//                 requests: [],
//                 total: 0,
//                 page,
//                 totalPages: 0,
//             };
//         }

//         // 2. Build the where clause for requests
//         const where = { userId: { in: userIds } };

//         // Date filtering
//         if (startDate && endDate) {
//             where.date = {
//                 gte: new Date(startDate),
//                 lte: new Date(endDate),
//             };
//         } else if (startDate) {
//             where.date = { gte: new Date(startDate) };
//         } else if (endDate) {
//             where.date = { lte: new Date(endDate) };
//         }

//         // Status filtering
//         if (status && status !== "ALL") {
//             where.status = status;
//         }

//         // 3. Query requests with pagination
//         const [requests, total] = await Promise.all([
//             prisma.request.findMany({
//                 where,
//                 include: {
//                     user: {
//                         select: {
//                             id: true,
//                             name: true,
//                             email: true,
//                             role: true,
//                             depot: true,
//                             department: true,
//                         },
//                     },
//                 },
//                 orderBy: { createdAt: "desc" },
//                 skip,
//                 take: limit,
//             }),
//             prisma.request.count({ where }),
//         ]);

//         return {
//             requests,
//             total,
//             page,
//             totalPages: Math.ceil(total / limit),
//         };
//     } catch (error) {
//         console.error("Error in getManagerUsersRequests:", error);
//         throw error;
//     }
// };

export const getManagerUsersRequests = async (
    managerId,
    role,
    page = 1,
    limit,
    startDate,
    endDate,
    status,
    departement,
) => {
    try {
        if (page < 1) throw new Error("Page must be at least 1");
        if (limit < 1) throw new Error("Limit must be at least 1");

        const skip = (page - 1) * limit;

        const getUserIds = async ({
            managerId: managerIdCondition,
            role: targetRole,
            field = "managerId",
        }) => {
            const where = {
                [field]: Array.isArray(managerIdCondition)
                    ? { in: managerIdCondition }
                    : managerIdCondition,
            };
            if (targetRole) where.role = targetRole;

            const users = await prisma.user.findMany({
                where,
                select: { id: true },
            });

            return users.map((user) => user.id);
        };

        // ------------------- HIERARCHY LOGIC (UNCHANGED) -------------------
        let userIds = [];

        switch (role) {
            case "BRANCH_OFFICER":
                const seniorIds = await getUserIds({ managerId, role: "SENIOR_OFFICER" });
                const juniorIds = await getUserIds({
                    managerId: seniorIds,
                    role: "JUNIOR_OFFICER",
                });
                userIds = await getUserIds({ managerId: juniorIds, role: "USER" });
                break;

            case "DEPT_CONTROLLER":
                const senior_Ids = await getUserIds({ managerId, role: "SENIOR_OFFICER" });
                const junior_Ids = await getUserIds({
                    managerId: senior_Ids,
                    role: "JUNIOR_OFFICER",
                });
                const sse_Ids = await getUserIds({ managerId: junior_Ids, role: "USER" });
                const je_Ids = await getUserIds({ managerId: sse_Ids, role: "JE" });
                userIds = [...sse_Ids, ...je_Ids];
                break;

            case "SENIOR_OFFICER":
                const juniorOfficerIds = await getUserIds({ managerId, role: "JUNIOR_OFFICER" });
                userIds = await getUserIds({ managerId: juniorOfficerIds, role: "USER" });
                break;

            case "JUNIOR_OFFICER":
                userIds = await getUserIds({ managerId, role: "USER" });
                break;

            default:
                throw new Error(`Role ${role} is not supported for this endpoint`);
        }

        // If no users found under hierarchy
        if (userIds.length === 0) {
            return {
                requests: [],
                total: 0,
                page,
                totalPages: 0,
                specialDeptRequests: [],
            };
        }

        // ------------------- DATE & STATUS FILTERS -------------------
        const dateFilter =
            startDate || endDate
                ? {
                      date: {
                          ...(startDate && { gte: new Date(startDate) }),
                          ...(endDate && { lte: new Date(endDate) }),
                      },
                  }
                : {};

        const statusFilter = status && status !== "ALL" ? { status } : {};

        // ------------------- HIERARCHY BASED REQUESTS -------------------
        const where = {
            userId: { in: userIds },
            ...dateFilter,
            ...statusFilter,
        };

        const [requests, total] = await Promise.all([
            prisma.request.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            depot: true,
                            department: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.request.count({ where }),
        ]);

        // ------------------- SPECIAL DEPT REQUESTS (IGNORES HIERARCHY) -------------------
        let specialDeptRequests = [];

        if (departement) {
            let deptCondition = {};

            if (departement === "ENGG") {
                deptCondition = {
                    enggDisconnectionsRequired: true,
                    allEnggAcceptance: { not: "ACCEPTED" },
                };
            } else if (departement === "S&T") {
                deptCondition = {
                    sntDisconnectionRequired: true,
                    allSntAcceptance: { not: "ACCEPTED" },
                };
            } else if (departement === "TRD") {
                deptCondition = { powerBlockRequired: true, allTrdAcceptance: { not: "ACCEPTED" } };
            }

            specialDeptRequests = await prisma.request.findMany({
                where: {
                    ...deptCondition,
                    ...dateFilter,
                    ...statusFilter,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            depot: true,
                            department: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            });
        }

        return {
            requests, // hierarchy
            total,
            page,
            totalPages: Math.ceil(total / limit),
            specialDeptRequests, // ✅ department-based flagged requests
        };
    } catch (error) {
        console.error("Error in getManagerUsersRequests:", error);
        throw error;
    }
};

// export const getManagerUsersRequests = async (managerId, role, page = 1, limit = 10) => {
//     const skip = (page - 1) * limit;

//     // helper to fetch direct reports of a given role
//     const fetchIds = async (ids, targetRole, field = "managerId") => {
//         if (ids.length === 0) return [];
//         const records = await prisma.user.findMany({
//             where: { [field]: { in: ids }, role: targetRole },
//             select: { id: true },
//         });
//         return records.map((r) => r.id);
//     };

//     // 1⃣ Build the list of USER-IDs under this manager, by role:
//     let userIds = [];

//     if (role === "BRANCH_OFFICER") {
//         const seniorIds = await prisma.user
//             .findMany({
//                 where: { managerId, role: "SENIOR_OFFICER" },
//                 select: { id: true },
//             })
//             .then((recs) => recs.map((r) => r.id));
//         console.log(seniorIds);
//         const juniorIds = await fetchIds(seniorIds, "JUNIOR_OFFICER");
//         console.log(juniorIds);
//         userIds = await fetchIds(juniorIds, "USER");
//     } else if (role === "SENIOR_OFFICER") {
//         // Senior → Juniors → Users
//         const juniorIds = await prisma.user
//             .findMany({
//                 where: { managerId, role: "JUNIOR_OFFICER" },
//                 select: { id: true },
//             })
//             .then((recs) => recs.map((r) => r.id));

//         userIds = await fetchIds(juniorIds, "USER");
//     } else if (role === "JUNIOR_OFFICER") {
//         // Junior → Users
//         userIds = await prisma.user
//             .findMany({
//                 where: { managerId, role: "USER" },
//                 select: { id: true },
//             })
//             .then((recs) => recs.map((r) => r.id));
//     } else {
//         throw new Error(`Role ${role} is not supported for this endpoint.`);
//     }

//     // 2⃣ Query & paginate Requests for those USER-IDs
//     const [requests, total] = await Promise.all([
//         prisma.request.findMany({
//             where: { userId: { in: userIds } },
//             include: {
//                 user: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                         role: true,
//                         depot: true,
//                         department: true,
//                     },
//                 },
//             },
//             orderBy: { createdAt: "desc" },
//             skip,
//             take: limit,
//         }),
//         prisma.request.count({
//             where: { userId: { in: userIds } },
//         }),
//     ]);

//     return {
//         requests,
//         total,
//         page,
//         totalPages: Math.ceil(total / limit),
//     };
// };

// export const getManagerUsersRequests = async (managerId, role, page = 1, limit = 10) => {
//     let finalManagerId = managerId;

//     // If the user is an officer, get their manager's ID
//     if (role === 'JUNIOR_OFFICER' || role === 'SENIOR_OFFICER') {
//         const subManager = await prisma.user.findUnique({
//             where: { id: managerId },
//             select: { managerId: true }
//         });

//         if (!subManager || !subManager.managerId) {
//             throw new Error("No manager assigned to this officer");
//         }

//         finalManagerId = subManager.managerId;
//     } else if (role === 'ADMIN') {
//         // For admin, get all managers under them
//         const managers = await prisma.user.findMany({
//             where: {
//                 adminId: managerId,
//                 role: 'BRANCH_OFFICER'
//             },
//             select: { id: true }
//         });

//         if (!managers || managers.length === 0) {
//             throw new Error("No managers found under this admin");
//         }

//         // Get all users under these managers
//         const users = await prisma.user.findMany({
//             where: {
//                 managerId: {
//                     in: managers.map(m => m.id)
//                 }
//             },
//             select: { id: true }
//         });

//         const userIds = users.map(user => user.id);

//         // put the where condition here
//         const whereCondition = {
//             userId: { in: userIds }
//         }

//         if (role === 'ADMIN') {
//             whereCondition.adminAcceptance = 'PENDING'
//             whereCondition.managerAcceptance = true
//         }
//         const skip = (page - 1) * limit;
//         const [requests, total] = await Promise.all([
//             prisma.request.findMany({
//                 where: whereCondition,
//                 include: {
//                     user: {
//                         select: {
//                             id: true,
//                             name: true,
//                             email: true,
//                             role: true,
//                             depot: true,
//                             department: true
//                         }
//                     }
//                 },
//                 orderBy: { createdAt: 'desc' },
//                 skip,
//                 take: limit
//             }),
//             prisma.request.count({
//                 where: {
//                     userId: { in: userIds }
//                 }
//             })
//         ]);

//         return {
//             requests,
//             total,
//             page,
//             totalPages: Math.ceil(total / limit)
//         };
//     }

//     // For managers and officers, get users under their manager
//     const users = await prisma.user.findMany({
//         where: { managerId: finalManagerId },
//         select: { id: true }
//     });

//     const userIds = users.map(user => user.id);

//     const skip = (page - 1) * limit;
//     const [requests, total] = await Promise.all([
//         prisma.request.findMany({
//             where: {
//                 userId: { in: userIds }
//             },
//             include: {
//                 user: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                         role: true,
//                         depot: true,
//                         department: true
//                     }
//                 }
//             },
//             orderBy: { createdAt: 'desc' },
//             skip,
//             take: limit
//         }),
//         prisma.request.count({
//             where: {
//                 userId: { in: userIds }
//             }
//         })
//     ]);

//     return {
//         requests,
//         total,
//         page,
//         totalPages: Math.ceil(total / limit)
//     };
// };
export const getAdminPendingRequests = async (
    role,
    page = 1,
    limit = 10,
    adminId,
    startDate,
    endDate,
) => {
    const skip = (page - 1) * limit;

    const fetchChildIds = async (parentIds, childRole) => {
        if (!parentIds || parentIds.length === 0) return [];
        const recs = await prisma.user.findMany({
            where: { managerId: { in: parentIds }, role: childRole },
            select: { id: true },
        });
        return recs.map((r) => r.id);
    };

    // 1) Gather all User IDs under this Admin's hierarchy:
    //    Admin → Branch Officers → Senior Officers → Junior Officers → Users → JEs
    const branchRecs = await prisma.user.findMany({
        where: { adminId, role: "DEPT_CONTROLLER" },
        select: { id: true },
    });
    const branchIds = branchRecs.map((r) => r.id);

    const seniorIds = await fetchChildIds(branchIds, "SENIOR_OFFICER");
    const juniorIds = await fetchChildIds(seniorIds, "JUNIOR_OFFICER");
    const sseIds = await fetchChildIds(juniorIds, "USER");
    const jeIds = await fetchChildIds(sseIds, "JE");
    const userIds = [...sseIds, ...jeIds];

    // 2) Build where clause for requests
    const whereClause = {
        userId: { in: userIds },
        managerAcceptance: true,
        ...(startDate &&
            endDate && {
                date: {
                    gte: new Date(startDate),
                    lt: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000),
                },
            }),
    };
    // 3) Fetch & paginate requests
    const [requests, total] = await Promise.all([
        prisma.request.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        depot: true,
                        department: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.request.count({
            where: whereClause,
        }),
    ]);

    return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

// export const acceptRequestByManager = async (requestId, managerId) => {
//     const request = await prisma.request.findUnique({
//         where: { id: requestId },
//     });

//     if (!request) {
//         throw new Error("Request not found");
//     }

//     return await prisma.request.update({
//         where: { id: requestId },
//         data: {
//             managerAcceptance: true,
//             managerAcceptanceId: managerId,
//         },
//     });
// };

// export const acceptRequestByManager = async (requestId, managerId, isAccept) => {
//     const request = await prisma.request.findUnique({
//         where: { id: requestId },
//     });

//     if (!request) {
//         throw new Error("Request not found");
//     }

//     return await prisma.request.update({
//         where: { id: requestId },
//         data: {
//             managerAcceptance: isAccept,
//             managerAcceptanceId: managerId,
//             status: isAccept ? "APPROVED" : "REJECTED",  // Update status based on isAccept
//         },
//     });
// };
// export const acceptRequestByManager = async (requestId, managerId, isAccept, remark) => {
//     const request = await prisma.request.findUnique({
//         where: { id: requestId },
//     });

//     if (!request) {
//         throw new Error("Request not found");
//     }

//     return await prisma.request.update({
//         where: { id: requestId },
//         data: {
//             managerAcceptance: isAccept,
//             managerAcceptanceId: managerId,
//             status: isAccept ? "APPROVED" : "REJECTED",
//             remarkByManager: remark || null, // Store the rejection reason
//         },
//     });
// };

// export const acceptRequestByManager = async (
//     requestId,
//     managerId,
//     isAccept,
//     remark,
//     mobileView,
// ) => {
//     try {
//         /* 1. Check the request exists (no need to pull admin chain anymore) */
//         const request = await prisma.request.findUnique({
//             where: { id: requestId },
//             select: { id: true }, // lightweight lookup
//         });

//         if (!request) {
//             return { ok: false, status: 404, message: "Request not found" };
//         }

//         /* 2. Look up the manager’s own adminId */
//         const managerRecord = await prisma.user.findUnique({
//             where: { id: managerId },
//             select: { adminId: true },
//         });

//         if (!managerRecord || !managerRecord.adminId) {
//             return { ok: false, status: 404, message: "Manager / admin not found" };
//         }

//         const adminId = managerRecord.adminId;

//         /* 3. Build the update payload */
//         const data = {
//             managerAcceptance: isAccept,
//             managerAcceptanceId: managerId,
//             status: isAccept ? "APPROVED" : "REJECTED",
//             remarkByManager: remark ?? null,
//             ...(mobileView && {
//                 adminRequestStatus: "ACCEPTED",
//                 adminAcceptance: true,
//                 adminAcceptanceId: adminId,
//             }),
//         };

//         /* 4. Persist */
//         const updated = await prisma.request.update({
//             where: { id: requestId },
//             data,
//         });

//         return { ok: true, status: 200, data: updated };
//     } catch (error) {
//         console.error("Error in acceptRequestByManager:", error);

//         if (error instanceof Prisma.PrismaClientKnownRequestError) {
//             return {
//                 ok: false,
//                 status: 500,
//                 message: "Database error",
//                 code: error.code,
//             };
//         }

//         return { ok: false, status: 500, message: "Internal server error" };
//     }
// };

export const acceptRequestByManager = async (
    requestId,
    managerId,
    isAccept,
    remark,
    mobileView,
) => {
    try {
        // 1. Fetch request with all required fields for conditions
        const request = await prisma.request.findUnique({
            where: { id: requestId },
            select: {
                id: true,
                managerAcceptance: true,
                adminAcceptance: true,
                userAcceptanceForSanction: true,
                corridorType: true,
                remarkByManager: true,
                sigActionsNeeded: true,
                trdActionsNeeded: true,
                DisconnAcceptance: true,
                status: true,
                sntDisconnectionRequired: true,
                powerBlockRequired: true,
                isSanctioned: true,
                optimizeStatus: true,
                sntDisconnections: {
                    select: {
                        id: true,
                        depot: true,
                        status: true,
                    },
                },
                trdDisconnections: {
                    select: {
                        id: true,
                        depot: true,
                        status: true,
                    },
                },
                allSntAcceptance: true,
                allTrdAcceptance: true,
                adminRequestStatus: true,
            },
        });

        if (!request) {
            return { ok: false, status: 404, message: "Request not found" };
        }

        // Reject Validation
        if (request.status === "REJECTED") {
            await prisma.request.update({
                where: { id: request.id },
                data: {
                    managerAcceptance: false,
                    managerAcceptanceId: "NOT MANAGER",
                },
            });
            return { ok: true, status: 208, data: [] };
        }

        const managerRecord = await prisma.user.findUnique({
            where: { id: managerId },
            select: { adminId: true },
        });

        if (!managerRecord || !managerRecord.adminId) {
            return { ok: false, status: 404, message: "Manager / admin not found" };
        }

        const adminId = managerRecord.adminId;

        // Calculate overall status using the common function
        const overAllStatus = calculateOverallStatus({
            isSanctioned: request.isSanctioned,
            userAcceptanceForSanction: request.userAcceptanceForSanction,
            managerAcceptance: isAccept,
            adminAcceptance: request.adminAcceptance,
            allSntAcceptance: request.allSntAcceptance,
            allTrdAcceptance: request.allTrdAcceptance,
            sntDisconnectionRequired: request.sntDisconnectionRequired,
            powerBlockRequired: request.powerBlockRequired,
            optimizeStatus: request.optimizeStatus,
            remarkByManager: isAccept ? null : remark,
            disconnectionRequestRejectRemarks: null,
            adminRequestStatus: request.adminRequestStatus,
        });

        // 4. Build update payload
        const data = {
            managerAcceptance: isAccept,
            managerAcceptanceId: managerId,
            status: isAccept ? "APPROVED" : "REJECTED",
            remarkByManager: remark ?? null,
            overAllStatus,
            managerResponseTiming: new Date(Date.now() + 5.5 * 60 * 60 * 1000),

            ...(mobileView && {
                adminRequestStatus: "ACCEPTED",
                adminAcceptance: true,
                adminAcceptanceId: adminId,
            }),
        };

        // 5. Persist
        const updated = await prisma.request.update({
            where: { id: requestId },
            data,
        });

        if (isAccept && request.corridorType === "Urgent Block") {
            try {
                // Get the complete updated request with all fields for notification
                const completeRequest = await prisma.request.findUnique({
                    where: { id: requestId },
                });

                await notificationService.notifyAdminsForAcceptedUrgentRequest(completeRequest);
            } catch (notificationError) {
                console.error("Failed to send notification to admins:", notificationError);
                // Don't throw the error as it shouldn't affect the request update
            }
        }

        return { ok: true, status: 200, data: updated };
    } catch (error) {
        console.error("Error in acceptRequestByManager:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {
                ok: false,
                status: 500,
                message: "Database error",
                code: error.code,
            };
        }

        return { ok: false, status: 500, message: "Internal server error" };
    }
};

// export const acceptRequestByAdmin = async (requestId, acceptance, adminId,mobileView,remarkByAdmin) => {
//     const request = await prisma.request.findUnique({
//         where: { id: requestId },
//     });

//     if (!request) {
//         throw new Error("Request not found");
//     }

//     return await prisma.request.update({
//         where: { id: requestId },
//         data: {
//             adminAcceptance: acceptance,
//             adminAcceptanceId: adminId,
//             adminRequestStatus: acceptance ? "ACCEPTED" : "REJECTED",
//         },
//     });
// };

// export const getUsersByAdminId = async (adminId, page = 1, limit = 10, startDate, endDate) => {
//     const skip = (page - 1) * limit;

//     // Convert dates to start and end of day in ISO format
//     const startDateTime = startDate ? new Date(startDate + "T00:00:00.000Z") : undefined;
//     const endDateTime = endDate ? new Date(endDate + "T23:59:59.999Z") : undefined;

//     const whereClause = {
//         adminAcceptance: true,
//         adminRequestStatus: "ACCEPTED",
//         managerAcceptance: true,
//         adminAcceptanceId: adminId,
//         ...(startDateTime &&
//             endDateTime && {
//             date: {
//                 gte: startDateTime,
//                 lte: endDateTime,
//             },
//         }),
//     };
//     console.log(whereClause);
//     const [requests, total] = await Promise.all([
//         prisma.request.findMany({
//             where: whereClause,
//             include: {
//                 user: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                         role: true,
//                     },
//                 },
//             },
//             orderBy: { createdAt: "desc" },
//             skip,
//             take: limit,
//         }),
//         prisma.request.count({
//             where: whereClause,
//         }),
//     ]);
//     console.log(requests);

//     return {
//         requests,
//         total,
//         page,
//         totalPages: Math.ceil(total / limit),
//         dateRange: {
//             startDate: startDateTime,
//             endDate: endDateTime,
//         },
//     };
// };
export const acceptRequestByAdmin = async (
    requestId,
    acceptance,
    adminId,
    mobileView,
    remarkByManager, // Changed parameter name to match your DB column
    adminRequestStatus,
) => {
    const request = await prisma.request.findUnique({
        where: { id: requestId },
        select: {
            id: true,
            isSanctioned: true,
            userAcceptanceForSanction: true,
            managerAcceptance: true,
            adminAcceptance: true,
            allSntAcceptance: true,
            allTrdAcceptance: true,
            sntDisconnectionRequired: true,
            powerBlockRequired: true,
            optimizeStatus: true,
            remarkByManager: true,
            disconnectionRequestRejectRemarks: true,
        },
    });

    if (!request) {
        throw new Error("Request not found");
    }

    // Calculate overall status based on admin's decision
    const overAllStatus = calculateOverallStatus({
        ...request,
        adminRequestStatus: adminRequestStatus,
        adminAcceptance: acceptance, // Admin's decision
        remarkByManager: acceptance
            ? request.remarkByManager
            : remarkByManager || "Rejected by admin",
    });

    const updateData = {
        adminAcceptance: acceptance,
        adminAcceptanceId: adminId,
        adminRequestStatus: acceptance ? "ACCEPTED" : "REJECTED",
        overAllStatus,
        status: acceptance ? "APPROVED" : "REJECTED",
        isSanctioned: acceptance,
        rejectedById: acceptance ? null : adminId,
    };

    // Add remark to remarkByManager column if mobileView is true and remark exists
    if (mobileView && remarkByManager) {
        updateData.remarkByManager = remarkByManager; // Updated to use your DB column name
    }

    return await prisma.request.update({
        where: { id: requestId },
        data: updateData,
    });
};
export const getUsersByAdminId = async (adminId, page = 1, limit = 10, startDate, endDate) => {
    const skip = (page - 1) * limit;

    const fetchChildIds = async (parentIds, childRole) => {
        if (!parentIds || parentIds.length === 0) return [];
        const recs = await prisma.user.findMany({
            where: { managerId: { in: parentIds }, role: childRole },
            select: { id: true },
        });
        return recs.map((r) => r.id);
    };

    // Build user hierarchy under admin
    const branchRecs = await prisma.user.findMany({
        where: { adminId, role: "DEPT_CONTROLLER" },
        select: { id: true },
    });
    const branchIds = branchRecs.map((r) => r.id);

    const seniorIds = await fetchChildIds(branchIds, "SENIOR_OFFICER");
    const juniorIds = await fetchChildIds(seniorIds, "JUNIOR_OFFICER");
    const sseIds = await fetchChildIds(juniorIds, "USER");

    // Get JE users who report to regular users
    const jeIds = await fetchChildIds(sseIds, "JE");

    // Combine regular users and JEs
    const userIds = [...sseIds, ...jeIds];

    // Convert date range
    const startDateTime = startDate ? new Date(startDate + "T00:00:00.000Z") : undefined;
    const endDateTime = endDate ? new Date(endDate + "T23:59:59.999Z") : undefined;

    // Final where clause
    const whereClause = {
        userId: { in: userIds },
        adminAcceptance: true,
        adminRequestStatus: "ACCEPTED",
        managerAcceptance: true,
        ...(startDateTime &&
            endDateTime && {
                date: {
                    gte: startDateTime,
                    lte: endDateTime,
                },
            }),
    };

    const [requests, total] = await Promise.all([
        prisma.request.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.request.count({
            where: whereClause,
        }),
    ]);

    return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        dateRange: {
            startDate: startDateTime,
            endDate: endDateTime,
        },
    };
};

export const approveAllPendingRequests = async (adminId, startDate, endDate) => {
    return await prisma.$transaction(async (tx) => {
        // Build the base where clause
        const whereClause = {
            adminRequestStatus: "PENDING",
        };

        // Add date range filter if provided
        if (startDate && endDate) {
            whereClause.date = {
                gte: startDate ? new Date(startDate + "T00:00:00.000Z") : undefined,
                lte: endDate ? new Date(endDate + "T23:59:59.999Z") : undefined,
            };
        }

        // First get all pending requests that will be updated
        const pendingRequests = await tx.request.findMany({
            where: whereClause,
            select: {
                id: true,
            },
        });

        if (pendingRequests.length === 0) {
            throw new Error("No pending requests found in the specified date range");
        }

        // Update all matching pending requests
        await tx.request.updateMany({
            where: whereClause,
            data: {
                adminRequestStatus: "ACCEPTED",
                adminAcceptance: true,
                adminAcceptanceId: adminId,
            },
        });

        return {
            count: pendingRequests.length,
            requestIds: pendingRequests.map((req) => req.id),
        };
    });
};

// export const approveAllPendingRequests = async (adminId) => {
//     return await prisma.$transaction(async (tx) => {
//         // First get all pending requests that will be updated
//         const pendingRequests = await tx.request.findMany({
//             where: {
//                 adminRequestStatus: "PENDING",
//             },
//             select: {
//                 id: true,
//             },
//         });

//         if (pendingRequests.length === 0) {
//             throw new Error("No pending requests found");
//         }

//         // Update all pending requests - removed updatedAt
//         await tx.request.updateMany({
//             where: {
//                 adminRequestStatus: "PENDING",
//             },
//             data: {
//                 adminRequestStatus: "ACCEPTED",
//                 adminAcceptance: true,
//                 adminAcceptanceId: adminId,
//                 // Removed: updatedAt: new Date(),
//             },
//         });

//         return {
//             count: pendingRequests.length,
//             requestIds: pendingRequests.map((req) => req.id),
//         };
//     });
// };

// export const saveOptimizedData = async (optimizedData) => {
//     try {
//         const created = await prisma.optimize_Table.createMany({
//             data: optimizedData.map(request => {
//                 // Combine date with time for proper DateTime format
//                 const timeFrom = new Date(`${request.date}T${request.demandTimeFrom}:00`);
//                 const timeTo = new Date(`${request.date}T${request.demandTimeTo}:00`);

//                 return {
//                     id: request.id,
//                     optimizeTimeFrom: timeFrom,
//                     optimizeTimeTo: timeTo,
//                     date: new Date(request.date),
//                     missionBlock: request.missionBlock,
//                     otherAffectedLine: request.otherAffectedLine,
//                     selectedDepartment: request.selectedDepartment,
//                     selectedDepo: request.selectedDepo,
//                     selectedStream: request.selectedStream,
//                     selectedLine: request.selectedLine ||
//                                 request.processedLineSections?.[0]?.lineName ||
//                                 'N/A',
//                     selectedSection: request.selectedSection,
//                 };
//             }),
//             skipDuplicates: true
//         });

//         return {
//             success: true,
//             count: created.count,
//             message: `${created.count} new optimized records added`
//         };
//     } catch (error) {
//         console.error('Failed to add optimized data:', error);
//         throw new Error('Database operation failed');
//     }
// };
// export const saveOptimizedData = async (optimizedData) => {
//     try {
//         // First, create the optimized records
//         const created = await prisma.optimize_Table.createMany({
//             data: optimizedData.map((request) => {
//                 // Combine date with time for proper DateTime format
//                 const timeFrom = new Date(`${request.date}T${request.optimisedTimeFrom}:00`);
//                 const timeTo = new Date(`${request.date}T${request.optimisedTimeTo}:00`);

//                 return {
//                     id: request.id,
//                     optimizeTimeFrom: timeFrom,
//                     optimizeTimeTo: timeTo,
//                     date: new Date(request.date),
//                     missionBlock: request.missionBlock,
//                     otherAffectedLine: request.otherAffectedLine,
//                     selectedDepartment: request.selectedDepartment,
//                     selectedDepo: request.selectedDepo,
//                     selectedStream: request.selectedStream,
//                     selectedLine:
//                         request.selectedLine ||
//                         request.processedLineSections?.[0]?.lineName ||
//                         "N/A",
//                     selectedSection: request.selectedSection,
//                 };
//             }),
//             skipDuplicates: true,
//         });

//         // Then update the original requests with the optimized times
//         await Promise.all(
//             optimizedData.map(async (request) => {
//                 const timeFrom = new Date(`${request.date}T${request.optimisedTimeFrom}:00`);
//                 const timeTo = new Date(`${request.date}T${request.optimisedTimeTo}:00`);

//                 await prisma.Request.update({
//                     where: { id: request.id },
//                     data: {
//                         optimizeTimeFrom: timeFrom,
//                         optimizeTimeTo: timeTo,
//                     },
//                 });
//             }),
//         );

//         return {
//             success: true,
//             count: created.count,
//             message: `${created.count} new optimized records added and requests updated`,
//         };
//     } catch (error) {
//         console.error("Failed to process optimized data:", error);
//         throw new Error("Database operation failed");
//     }
// };
export const saveOptimizedData = async (optimizedData) => {
    try {
        // Fetch original requests to get demandTimeFrom and demandTimeTo
        const requestIds = optimizedData.map((r) => r.id);
        const originalRequests = await prisma.Request.findMany({
            where: { id: { in: requestIds } },
            select: {
                id: true,
                demandTimeFrom: true,
                demandTimeTo: true,
            },
        });

        // Create a map for easy access
        const originalMap = new Map(originalRequests.map((r) => [r.id, r]));

        // First, create the optimized records
        const created = await prisma.optimize_Table.createMany({
            data: optimizedData.map((request) => {
                const originalRequest = originalMap.get(request.id);
                if (!originalRequest) {
                    throw new Error(`Original request ${request.id} not found`);
                }

                // Extract date parts from original demand times (UTC)
                const demandFromDate = originalRequest.demandTimeFrom.toISOString().split("T")[0];
                const demandToDate = originalRequest.demandTimeTo.toISOString().split("T")[0];

                // Parse optimized times
                const [fromHours, fromMinutes] = request.optimisedTimeFrom.split(":").map(Number);
                const [toHours, toMinutes] = request.optimisedTimeTo.split(":").map(Number);

                // Create dates in UTC to avoid timezone conversion
                let timeFrom, timeTo;

                if (toHours < fromHours || (toHours === fromHours && toMinutes < fromMinutes)) {
                    // Time crosses midnight - end time is next day
                    const [year, month, day] = demandFromDate.split("-").map(Number);
                    timeFrom = new Date(Date.UTC(year, month - 1, day, fromHours, fromMinutes, 0));

                    // Next day for end time
                    timeTo = new Date(Date.UTC(year, month - 1, day + 1, toHours, toMinutes, 0));
                } else {
                    // Normal case - same day
                    const [yearFrom, monthFrom, dayFrom] = demandFromDate.split("-").map(Number);
                    const [yearTo, monthTo, dayTo] = demandToDate.split("-").map(Number);

                    timeFrom = new Date(
                        Date.UTC(yearFrom, monthFrom - 1, dayFrom, fromHours, fromMinutes, 0),
                    );
                    timeTo = new Date(Date.UTC(yearTo, monthTo - 1, dayTo, toHours, toMinutes, 0));
                }

                return {
                    id: request.id,
                    optimizeTimeFrom: timeFrom,
                    optimizeTimeTo: timeTo,
                    date: new Date(request.date), // Use UTC date
                    missionBlock: request.missionBlock,
                    otherAffectedLine: request.otherAffectedLine,
                    selectedDepartment: request.selectedDepartment,
                    selectedDepo: request.selectedDepo,
                    selectedStream: request.selectedStream,
                    selectedLine:
                        request.selectedLine ||
                        request.processedLineSections?.[0]?.lineName ||
                        "N/A",
                    selectedSection: request.selectedSection,
                };
            }),
            skipDuplicates: true,
        });

        // Then update the original requests with the optimized times
        await Promise.all(
            optimizedData.map(async (request) => {
                const originalRequest = originalMap.get(request.id);
                if (!originalRequest) return;

                // Extract date parts from original demand times (UTC)
                const demandFromDate = originalRequest.demandTimeFrom.toISOString().split("T")[0];
                const demandToDate = originalRequest.demandTimeTo.toISOString().split("T")[0];

                // Parse optimized times
                const [fromHours, fromMinutes] = request.optimisedTimeFrom.split(":").map(Number);
                const [toHours, toMinutes] = request.optimisedTimeTo.split(":").map(Number);

                let timeFrom, timeTo;

                if (toHours < fromHours || (toHours === fromHours && toMinutes < fromMinutes)) {
                    // Time crosses midnight
                    const [year, month, day] = demandFromDate.split("-").map(Number);
                    timeFrom = new Date(Date.UTC(year, month - 1, day, fromHours, fromMinutes, 0));
                    timeTo = new Date(Date.UTC(year, month - 1, day + 1, toHours, toMinutes, 0));
                } else {
                    // Normal case
                    const [yearFrom, monthFrom, dayFrom] = demandFromDate.split("-").map(Number);
                    const [yearTo, monthTo, dayTo] = demandToDate.split("-").map(Number);

                    timeFrom = new Date(
                        Date.UTC(yearFrom, monthFrom - 1, dayFrom, fromHours, fromMinutes, 0),
                    );
                    timeTo = new Date(Date.UTC(yearTo, monthTo - 1, dayTo, toHours, toMinutes, 0));
                }

                await prisma.Request.update({
                    where: { id: request.id },
                    data: {
                        optimizeTimeFrom: timeFrom,
                        optimizeTimeTo: timeTo,
                    },
                });
            }),
        );

        return {
            success: true,
            count: created.count,
            message: `${created.count} new optimized records added and requests updated`,
        };
    } catch (error) {
        console.error("Failed to process optimized data:", error);
        throw new Error("Database operation failed");
    }
};
export const getTrdRequests = async (
    selectedDepo,
    page = 1,
    limit = 10,
    userEmail,
    startDate,
    endDate,
) => {
    const skip = (page - 1) * limit;

    // Build the where clause
    const whereClause = {
        trdActionsNeeded: true,
        selectedDepo: selectedDepo,
        ...(userEmail && { trdDisconnectionAssignTo: userEmail }),
        ...(startDate &&
            endDate && {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            }),
    };

    const [requests, total] = await Promise.all([
        prisma.request.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.request.count({
            where: whereClause,
        }),
    ]);

    return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

// export const getOptimizeData = async (adminId, page = 1, limit = 10, startDate, endDate) => {
//     const skip = (page - 1) * limit;

//     // Convert dates
//     const startDateTime = startDate ? new Date(startDate + "T00:00:00.000Z") : undefined;
//     const endDateTime = endDate ? new Date(endDate + "T23:59:59.999Z") : undefined;

//     // 1. Get optimized IDs
//     const optimizedIds = await prisma.optimize_Table.findMany({
//         select: { id: true },
//     });
//     const optimizedIdList = optimizedIds.map((item) => item.id);

//     // 2. Get matching requests
//     const whereClause = {
//         id: { in: optimizedIdList },
//         adminAcceptance: true,
//         adminRequestStatus: "ACCEPTED",
//         managerAcceptance: true,
//         adminAcceptanceId: adminId,
//         ...(startDateTime &&
//             endDateTime && {
//                 date: { gte: startDateTime, lte: endDateTime },
//             }),
//     };

//     const [requests, total] = await Promise.all([
//         prisma.request.findMany({
//             where: whereClause,
//             include: { user: { select: { id: true, name: true, email: true, role: true } } },
//             orderBy: { createdAt: "desc" },
//             skip,
//             take: limit,
//         }),
//         prisma.request.count({ where: whereClause }),
//     ]);

//     // 3. Get optimize data separately if needed
//     const optimizeData = await prisma.optimize_Table.findMany({
//         where: { id: { in: optimizedIdList } },
//     });

//     // Combine data
//     const result = requests.map((request) => ({
//         ...request,
//         optimizeData: optimizeData.find((opt) => opt.id === request.id),
//     }));

//     return {
//         requests: result,
//         total,
//         page,
//         totalPages: Math.ceil(total / limit),
//         dateRange: { startDate: startDateTime, endDate: endDateTime },
//     };
// };

export const getOptimizeData = async (adminId, page = 1, limit = 10, startDate, endDate) => {
    const skip = (page - 1) * limit;

    // Validate and convert dates
    if (!startDate || !endDate) {
        throw new Error("Both startDate and endDate are required for filtering");
    }

    const startDateTime = new Date(`${startDate}T00:00:00.000Z`);
    const endDateTime = new Date(`${endDate}T23:59:59.999Z`);

    // Strict date filtering where clause
    const whereClause = {
        adminAcceptance: true,
        adminRequestStatus: "ACCEPTED",
        managerAcceptance: true,
        adminAcceptanceId: adminId,
        optimizeStatus: true,
        date: {
            gte: startDateTime,
            lte: endDateTime,
        },
    };

    const [requests, total] = await Promise.all([
        prisma.request.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.request.count({ where: whereClause }),
    ]);

    // Get optimize data only for the filtered requests
    const optimizeData = await prisma.optimize_Table.findMany({
        where: {
            id: { in: requests.map((r) => r.id) },
        },
    });

    // Combine the data
    const result = requests.map((request) => ({
        ...request,
        optimizeData: optimizeData.find((opt) => opt.id === request.id) || null,
    }));

    return {
        requests: result,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        dateRange: {
            startDate: startDateTime,
            endDate: endDateTime,
        },
    };
};

export const saveOptimizedRequestsStatus = async (requestIds) => {
    try {
        await prisma.Request.updateMany({
            where: {
                id: { in: requestIds },
            },
            data: {
                optimizeStatus: true,
            },
        });

        return {
            success: true,
            message: `${requestIds.length} requests marked as optimized`,
        };
    } catch (error) {
        console.error("Failed to update optimized status:", error);
        throw new Error("Database operation failed");
    }
};

export const batchAcceptRequests = async (ids) => {
    const result = await prisma.request.updateMany({
        where: {
            id: {
                in: ids,
            },
            status: "PENDING",
        },
        data: {
            status: "APPROVED",
        },
    });

    return result.count; // Prisma returns `{ count: number }`
};

// export const getManagerRequestData = async (
//     managerId,
//     role,
//     page = 1,
//     limit,
//     startDate,
//     endDate,
//     status,
//     optimizedOnly = false // New parameter to filter optimized requests
// ) => {
//     try {
//         // Validate inputs
//         if (page < 1) throw new Error('Page must be at least 1');
//         if (limit < 1) throw new Error('Limit must be at least 1');

//         const skip = (page - 1) * limit;

//         // Helper to fetch user IDs with a single query
//         const getUserIds = async ({ managerId: managerIdCondition, role: targetRole, field = 'managerId' }) => {
//             const where = {
//                 [field]: Array.isArray(managerIdCondition)
//                     ? { in: managerIdCondition }
//                     : managerIdCondition
//             };
//             if (targetRole) where.role = targetRole;

//             const users = await prisma.user.findMany({
//                 where,
//                 select: { id: true }
//             });

//             return users.map(user => user.id);
//         };

//         // 1. Build the list of USER-IDs under this manager hierarchy
//         let userIds = [];

//         switch (role) {
//             case 'BRANCH_OFFICER':
//                 const seniorIds = await getUserIds({ managerId, role: 'SENIOR_OFFICER' });
//                 const juniorIds = await getUserIds({ managerId: seniorIds, role: 'JUNIOR_OFFICER' });
//                 userIds = await getUserIds({ managerId: juniorIds, role: 'USER' });
//                 break;

//             case 'SENIOR_OFFICER':
//                 const juniorOfficerIds = await getUserIds({ managerId, role: 'JUNIOR_OFFICER' });
//                 userIds = await getUserIds({ managerId: juniorOfficerIds, role: 'USER' });
//                 break;

//             case 'JUNIOR_OFFICER':
//                 userIds = await getUserIds({ managerId, role: 'USER' });
//                 break;

//             default:
//                 throw new Error(`Role ${role} is not supported for this endpoint`);
//         }

//         // Early return if no users found
//         if (userIds.length === 0) {
//             return {
//                 requests: [],
//                 total: 0,
//                 page,
//                 totalPages: 0
//             };
//         }

//         // 2. Build the where clause for requests
//         const where = {
//             userId: { in: userIds },
//             // Add optimization status filter if requested
//             ...(optimizedOnly && { isOptimized: true })
//         };

//         // Date filtering
//         if (startDate && endDate) {
//             where.date = {
//                 gte: new Date(startDate),
//                 lte: new Date(endDate)
//             };
//         } else if (startDate) {
//             where.date = { gte: new Date(startDate) };
//         } else if (endDate) {
//             where.date = { lte: new Date(endDate) };
//         }

//         // Status filtering
//         if (status && status !== 'ALL') {
//             where.status = status;
//         }

//         // 3. Query requests with pagination
//         const [requests, total] = await Promise.all([
//             prisma.request.findMany({
//                 where,
//                 include: {
//                     user: {
//                         select: {
//                             id: true,
//                             name: true,
//                             email: true,
//                             role: true,
//                             depot: true,
//                             department: true,
//                         },
//                     },
//                 },
//                 orderBy: { createdAt: 'desc' },
//                 skip,
//                 take: limit,
//             }),
//             prisma.request.count({ where }),
//         ]);

//         return {
//             requests,
//             total,
//             page,
//             totalPages: Math.ceil(total / limit),
//         };

//     } catch (error) {
//         console.error('Error in getManagerUsersRequests:', error);
//         throw error;
//     }
// };
export const getManagerRequestData = async (
    managerId,
    role,
    page = 1,
    limit,
    startDate,
    endDate,
    status,
    optimizedOnly = false, // New parameter to filter optimized requests
) => {
    try {
        // Validate inputs
        if (page < 1) throw new Error("Page must be at least 1");
        if (limit < 1) throw new Error("Limit must be at least 1");

        const skip = (page - 1) * limit;

        // Helper to fetch user IDs with a single query
        const getUserIds = async ({
            managerId: managerIdCondition,
            role: targetRole,
            field = "managerId",
        }) => {
            const where = {
                [field]: Array.isArray(managerIdCondition)
                    ? { in: managerIdCondition }
                    : managerIdCondition,
            };
            if (targetRole) where.role = targetRole;

            const users = await prisma.user.findMany({
                where,
                select: { id: true },
            });

            return users.map((user) => user.id);
        };

        // 1. Build the list of USER-IDs under this manager hierarchy
        let userIds = [];

        switch (role) {
            case "BRANCH_OFFICER":
                const seniorIds = await getUserIds({ managerId, role: "SENIOR_OFFICER" });
                const juniorIds = await getUserIds({
                    managerId: seniorIds,
                    role: "JUNIOR_OFFICER",
                });
                userIds = await getUserIds({ managerId: juniorIds, role: "USER" });
                break;

            case "SENIOR_OFFICER":
                const juniorOfficerIds = await getUserIds({ managerId, role: "JUNIOR_OFFICER" });
                userIds = await getUserIds({ managerId: juniorOfficerIds, role: "USER" });
                break;

            case "JUNIOR_OFFICER":
                userIds = await getUserIds({ managerId, role: "USER" });
                break;

            default:
                throw new Error(`Role ${role} is not supported for this endpoint`);
        }

        // Early return if no users found
        if (userIds.length === 0) {
            return {
                requests: [],
                total: 0,
                page,
                totalPages: 0,
            };
        }

        // 2. Build the where clause for requests
        const where = {
            userId: { in: userIds },
            // Add optimization status filter if requested
            ...(optimizedOnly && { isOptimized: true }),
        };

        // Date filtering
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        } else if (startDate) {
            where.date = { gte: new Date(startDate) };
        } else if (endDate) {
            where.date = { lte: new Date(endDate) };
        }

        // Status filtering
        if (status && status !== "ALL") {
            where.status = status;
        }

        // 3. Query requests with pagination
        const [requests, total] = await Promise.all([
            prisma.request.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            depot: true,
                            department: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.request.count({ where }),
        ]);

        return {
            requests,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("Error in getManagerUsersRequests:", error);
        throw error;
    }
};

export const userRequestRemarkAccept = async (id) => {
    const request = await prisma.request.findUnique({
        where: { id },
        select: {
            id: true,
            isSanctioned: true,
            userAcceptanceForSanction: true,
            managerAcceptance: true,
            adminAcceptance: true,
            allSntAcceptance: true,
            allTrdAcceptance: true,
            sntDisconnectionRequired: true,
            powerBlockRequired: true,
            optimizeStatus: true,
            remarkByManager: true,
            disconnectionRequestRejectRemarks: true,
        },
    });
    if (!request) {
        throw new Error("Request not found");
    }

    // Calculate overall status after user acceptance
    const overAllStatus = calculateOverallStatus({
        ...request,
        userAcceptanceForSanction: true, // User is accepting
    });

    return await prisma.request.update({
        where: { id },
        data: {
            userAcceptanceForSanction: true,
            overAllStatus,
        },
    });
};

export const userRequestRemarkReject = async (id, remark) => {
    const request = await prisma.request.findUnique({
        where: { id },
        select: {
            id: true,
            isSanctioned: true,
            userAcceptanceForSanction: true,
            managerAcceptance: true,
            adminAcceptance: true,
            allSntAcceptance: true,
            allTrdAcceptance: true,
            sntDisconnectionRequired: true,
            powerBlockRequired: true,
            optimizeStatus: true,
            remarkByManager: true,
            disconnectionRequestRejectRemarks: true,
        },
    });
    if (!request) {
        throw new Error("Request not found");
    }

    // Calculate overall status after user rejection (back to previous state)
    const overAllStatus = calculateOverallStatus({
        ...request,
        remark: remark || "",
        userAcceptanceForSanction: false,
    });

    return await prisma.request.update({
        where: { id },
        data: {
            userAcceptanceForSanction: false,
            // isSanctioned: false,
            userResponse: remark,
            overAllStatus,
        },
    });
};
export const getManagerCugRequests = async (cugNumber) => {
    const user = await prisma.user.findFirst({
        where: { phone: cugNumber },
    });

    if (!user?.managerId) return null;

    const manager = await prisma.user.findUnique({
        where: { id: user.managerId },
    });

    return manager?.phone || null;
};

/**
 * Edit a user request's time-related fields (date, demandTimeFrom, demandTimeTo)
 * @param {string} requestId - The ID of the request to edit
 * @param {Object} data - Object containing date, demandTimeFrom, and demandTimeTo
 * @returns {Promise<Object>} - The updated request
 */
export const editUserRequest = async (requestId, data) => {
    try {
        // Convert string dates to Date objects
        const updateData = {
            date: new Date(data.date),
            demandTimeFrom: new Date(data.demandTimeFrom),
            demandTimeTo: new Date(data.demandTimeTo),
            tpcRemarks: data.tpcRemarks || "",
        };

        // Validate that demandTimeTo is after demandTimeFrom
        if (updateData.demandTimeTo <= updateData.demandTimeFrom) {
            throw new Error("End time must be after start time");
        }

        // Update the request
        const updatedRequest = await prisma.request.update({
            where: { id: requestId },
            data: updateData,
            select: {
                id: true,
                divisionId: true,
                date: true,
                demandTimeFrom: true,
                demandTimeTo: true,
                status: true,
                createdAt: true,
                selectedDepartment: true,
                selectedSection: true,
                activity: true,
                tpcRemarks: true,
            },
        });

        if (!updatedRequest) {
            throw new Error("Request not found or update failed");
        }

        return updatedRequest;
    } catch (error) {
        console.error("Error in editUserRequest:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return {
                ok: false,
                status: 500,
                message: "Database error",
                code: error.code,
            };
        }

        return {
            ok: false,
            status: error.message === "End time must be after start time" ? 400 : 500,
            message: error.message || "Internal server error",
        };
    }
};

// New function to get summary requests for a user's section (excluding the user's own requests)
export const getSectionSummaryRequests = async (
    userId,
    selectedSection,
    page = 1,
    limit = 10,
    startDate,
    endDate,
) => {
    const skip = (page - 1) * limit;

    // Build the where clause for the section's requests excluding the user's own
    const whereClause = {
        selectedSection: selectedSection,
        isSanctioned: true,
        userId: {
            not: userId, // Exclude the current user's requests
        },
        ...(startDate &&
            endDate && {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            }),
    };

    // Get requests and count in parallel for efficiency
    const [requests, total] = await Promise.all([
        prisma.request.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        department: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.request.count({
            where: whereClause,
        }),
    ]);

    return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        selectedSection,
    };
};
