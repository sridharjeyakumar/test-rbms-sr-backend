import prisma from "../prisma/index.js";

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

export const createRequest = async (data, userId, divisionCode) => {
    try {
        // List of allowed fields from Prisma schema
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
            "workNature",
            "powerBlockDisconnectionAssignTo",
            "duration",
            "isSanctioned",
        ];

        // Filter out any fields not in allowedFields
        const filteredData = Object.fromEntries(
            Object.entries(data).filter(([key]) => allowedFields.includes(key)),
        );

        // 1. Use the exact date from frontend request
        const requestDate = new Date(data.date);
        const now = new Date(); // Current timestamp for createdAt

        // 2. Get last 2 digits of year
        const yearPart = requestDate.getFullYear().toString().slice(-2);

        // 3. Convert month to letter (A=Jan, B=Feb, etc., skipping I)
        const month = requestDate.getMonth();
        let monthChar = String.fromCharCode(65 + month);
        if (month >= 8) monthChar = String.fromCharCode(66 + month); // Skip I

        // 4. Fixed "K"
        const fixedChar = "K";

        // 5. Map division code to corresponding letter
        const divisionMap = {
            MAS: "A",
            MDU: "B",
            SA: "C",
            PGT: "D",
            TPJ: "E",
            TVC: "F",
        };

        // Get the base division code (first 3 characters)
        const baseDivisionCode = divisionCode?.toUpperCase().slice(0, 3) || "GEN";
        // Get the mapped letter or use original if not in map
        const divisionLetter = divisionMap[baseDivisionCode] || baseDivisionCode.slice(0, 1);

        // 6. Calculate date range for current month
        const startOfMonth = new Date(requestDate.getFullYear(), requestDate.getMonth(), 1);
        const endOfMonth = new Date(requestDate.getFullYear(), requestDate.getMonth() + 1, 1);

        // 7. Find most recent request for this month+division
        const lastRequest = await prisma.request.findFirst({
            where: {
                createdAt: { lt: now }, // Only check requests created before this one
                date: { gte: startOfMonth, lt: endOfMonth },
                divisionId: {
                    startsWith: `${yearPart}${monthChar}${fixedChar}${divisionLetter}`,
                },
            },
            orderBy: { createdAt: "desc" }, // Get the newest one
        });

        // 8. Determine increment number (now 5 digits)
        const lastIncrement = lastRequest?.divisionId?.slice(-5) || "00000";
        const incrementPart = (parseInt(lastIncrement) + 1).toString().padStart(5, "0");

        // 9. Generate final ID (format: YYMonthKDivisionLetter#####)
        const divisionId = `${yearPart}${monthChar}${fixedChar}${divisionLetter}${incrementPart}`;

        // Extras. If any of the isSanctioned and managerAcceptance are true, set sanctioned times and manager response timing
        if (filteredData.isSanctioned === true) {
            filteredData.sanctionedTimeFrom = filteredData.demandTimeFrom;
            filteredData.sanctionedTimeTo = filteredData.demandTimeTo;
        }

        if (filteredData.managerAcceptance === true) {
            filteredData.managerResponseTiming = now;
        }

        // 10. Create the request with generated ID
        return await prisma.request.create({
            data: {
                ...filteredData,
                userId,
                status: filteredData.isSanctioned ? "APPROVED" : "PENDING",
                divisionId,
                overAllStatus: "with Dept controller",
                createdAt: now,
            },
        });
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
) => {
    const updatedRequest = await prisma.request.update({
        where: { id: requestId },
        data: {
            optimizeTimeFrom,
            optimizeTimeTo,
            date,
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
            return prisma.request.update({
                where: { id: request.id },
                data: {
                    isSanctioned: true,
                    sanctionedTimeFrom: request.optimizeTimeFrom,
                    sanctionedTimeTo: request.optimizeTimeTo,
                    ...(isOptimized && { overAllStatus: "Sanctioned" }),
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

    const whereClause = {
        userId,
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
    userEmail, // Keeping this parameter in case it's used elsewhere
    startDate,
    endDate,
    userDepartement,
) => {
    const skip = (page - 1) * limit;

    // Build the where clause
    // const whereClause = {
    //     OR: [
    //         {
    //             sntDisconnectionRequired: true,
    //             sntDisconnectionAssignTo: selectedDepo,
    //         },
    //         {
    //             trdActionsNeeded: true,
    //             powerBlockDisconnectionAssignTo: selectedDepo,
    //         },
    //     ],
    //     ...(startDate &&
    //         endDate && {
    //             date: {
    //                 gte: new Date(startDate),
    //                 lte: new Date(endDate),
    //             },
    //         }),
    // };
    let whereClause = {};

    if (userDepartement === "S&T") {
        whereClause = {
            sntDisconnectionRequired: true,
            sntDisconnectionAssignTo: selectedDepo,
        };
    } else if (userDepartement === "TRD") {
        whereClause = {
            powerBlockRequired: true,
            powerBlockDisconnectionAssignTo: selectedDepo,
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
//     userDepartement,
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
//         if (userDepartement === "S&T") {
//             updateData.sigActionsNeeded = acceptance;
//             updateData.sigResponse = !acceptance ? disconnectionRequestRejectRemarks : "";
//         } else if (userDepartement === "TRD") {
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
    userDepartement,
    mobileView,
    location,
) => {
    console.log(acceptance ? "ACCEPTED" : "REJECTED");

    const request = await prisma.request.findUnique({
        where: { id },
        select: {
            managerAcceptance: true,
            sigActionsNeeded: true,
            sigResponse: true,
            oheResponse: true,
            trdActionsNeeded: true,
            sntDisconnectionRequired: true,
            powerBlockRequired: true,
            remarkByManager: true,
            isSanctioned: true,
            optimizeStatus: true,
        },
    });

    if (!request) {
        return { ok: false, status: 404, message: "Request not found" };
    }

    let updatedSigActionsNeeded = request.sigActionsNeeded;
    let updatedTrdActionsNeeded = request.trdActionsNeeded;
    let updatedSigResponse = request.sigResponse;
    let updatedOheResponse = request.oheResponse;

    const updateData = {
        DisconnAcceptance: acceptance ? "ACCEPTED" : "REJECTED",
        // disconnectionRequestRejectRemarks:
        //     !acceptance && mobileView !== "mobileView" ? disconnectionRequestRejectRemarks : null,
    };
    if (location === "PGT") {
        updateData.disconnectionRequestRejectRemarks = disconnectionRequestRejectRemarks;
    } else {
        if (!acceptance && mobileView !== "mobileView") {
            updateData.disconnectionRequestRejectRemarks = disconnectionRequestRejectRemarks;
        }
    }

    if (mobileView === "mobileView") {
        if (userDepartement === "S&T") {
            updatedSigActionsNeeded = acceptance;
            updatedSigResponse = !acceptance ? disconnectionRequestRejectRemarks : "";
            updateData.sigActionsNeeded = updatedSigActionsNeeded;
            updateData.sigResponse = updatedSigResponse;
        } else if (userDepartement === "TRD") {
            updatedTrdActionsNeeded = acceptance;
            updatedOheResponse = !acceptance ? disconnectionRequestRejectRemarks : "";
            updateData.trdActionsNeeded = updatedTrdActionsNeeded;
            updateData.oheResponse = updatedOheResponse;
        }
    }

    let overAllStatus;

    if (
        request.managerAcceptance === true &&
        updatedSigActionsNeeded === false &&
        updatedSigResponse?.trim() !== "" &&
        request.sntDisconnectionRequired === true
    ) {
        overAllStatus = "return to applicant by s&t.";
    } else if (
        request.managerAcceptance === false &&
        request.remarkByManager?.trim() === "" &&
        updatedSigActionsNeeded === false &&
        updatedSigResponse?.trim() !== "" &&
        request.sntDisconnectionRequired === true
    ) {
        overAllStatus = "return to applicant by s&t.";
    } else if (
        request.managerAcceptance === true &&
        updatedSigActionsNeeded === true &&
        request.sntDisconnectionRequired === true &&
        updatedTrdActionsNeeded === false &&
        request.powerBlockRequired === true
    ) {
        overAllStatus = "with trd disconnection.";
    } else if (
        request.managerAcceptance === true &&
        updatedSigActionsNeeded === false &&
        request.sntDisconnectionRequired === true &&
        updatedTrdActionsNeeded === true &&
        request.powerBlockRequired === true
    ) {
        overAllStatus = "with s&t disconnection.";
    } else if (
        request.managerAcceptance === true &&
        updatedOheResponse?.trim() !== "" &&
        updatedTrdActionsNeeded === false &&
        request.powerBlockRequired === true
    ) {
        overAllStatus = "return to applicant by trd.";
    } else if (
        request.managerAcceptance === false &&
        request.remarkByManager?.trim() === "" &&
        updatedOheResponse?.trim() !== "" &&
        updatedTrdActionsNeeded === false &&
        request.powerBlockRequired === true
    ) {
        overAllStatus = "return to applicant by trd.";
    } else if (
        request.managerAcceptance === false &&
        updatedSigActionsNeeded === false &&
        request.remarkByManager?.trim() === "" &&
        updatedSigResponse?.trim() !== "" &&
        updatedOheResponse?.trim() !== "" &&
        updatedTrdActionsNeeded === false
    ) {
        overAllStatus = "return to applicant by s&t and trd.";
    } else if (
        request.managerAcceptance === true &&
        updatedSigActionsNeeded === true &&
        request.isSanctioned === false &&
        request.optimizeStatus === false &&
        request.powerBlockRequired === false
    ) {
        overAllStatus = "with optg.";
    } else if (
        request.managerAcceptance === true &&
        updatedTrdActionsNeeded === true &&
        request.isSanctioned === false &&
        request.optimizeStatus === false &&
        request.sntDisconnectionRequired === false
    ) {
        overAllStatus = "with optg.";
    } else if (
        request.managerAcceptance === true &&
        updatedTrdActionsNeeded === true &&
        updatedSigActionsNeeded === true &&
        request.isSanctioned === false &&
        request.optimizeStatus === false
    ) {
        overAllStatus = "with optg.";
    }

    if (overAllStatus) {
        updateData.overAllStatus = overAllStatus;
    }

    const updated = await prisma.request.update({
        where: { id },
        data: updateData,
    });

    return { ok: true, status: 200, data: updated };
};

export const getManagerUsersRequests = async (
    managerId,
    role,
    page = 1,
    limit,
    startDate,
    endDate,
    status,
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

            case "DEPT_CONTROLLER":
                const senior_Ids = await getUserIds({ managerId, role: "SENIOR_OFFICER" });
                const junior_Ids = await getUserIds({
                    managerId: senior_Ids,
                    role: "JUNIOR_OFFICER",
                });
                userIds = await getUserIds({ managerId: junior_Ids, role: "USER" });
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
        const where = { userId: { in: userIds } };

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
    //    Admin → Branch Officers → Senior Officers → Junior Officers → Users
    const branchRecs = await prisma.user.findMany({
        where: { adminId, role: "DEPT_CONTROLLER" },
        select: { id: true },
    });
    const branchIds = branchRecs.map((r) => r.id);

    const seniorIds = await fetchChildIds(branchIds, "SENIOR_OFFICER");
    const juniorIds = await fetchChildIds(seniorIds, "JUNIOR_OFFICER");
    const userIds = await fetchChildIds(juniorIds, "USER");
    console.log(userIds);
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
    console.log(whereClause);
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
    console.log("requests", requests);

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
                remarkByManager: true,
                sigActionsNeeded: true,
                sigResponse: true,
                oheResponse: true,
                trdActionsNeeded: true,
                DisconnAcceptance: true,
                sntDisconnectionRequired: true,
                powerBlockRequired: true,
                isSanctioned: true,
                optimizeStatus: true,
            },
        });

        if (!request) {
            return { ok: false, status: 404, message: "Request not found" };
        }

        const managerRecord = await prisma.user.findUnique({
            where: { id: managerId },
            select: { adminId: true },
        });

        if (!managerRecord || !managerRecord.adminId) {
            return { ok: false, status: 404, message: "Manager / admin not found" };
        }

        const adminId = managerRecord.adminId;

        // 2. Compute overAllStatus based on conditions
        let overAllStatus = undefined;

        if (isAccept === false && remark) {
            overAllStatus = "return to applicant by Dept controller.";
        } else if (
            isAccept === true &&
            request.sigActionsNeeded === false &&
            request.sigResponse === "" &&
            request.oheResponse === "" &&
            request.trdActionsNeeded === false &&
            request.DisconnAcceptance !== "ACCEPTED" &&
            request.sntDisconnectionRequired === true &&
            request.powerBlockRequired === true
        ) {
            overAllStatus = "with s&t dsiconnection and with trd disconnection.";
        } else if (
            isAccept === true &&
            request.sigActionsNeeded === false &&
            request.sigResponse === "" &&
            request.sntDisconnectionRequired === true &&
            request.powerBlockRequired === false
        ) {
            overAllStatus = "with s&t for disconnection.";
        } else if (
            isAccept === true &&
            request.sigActionsNeeded === false &&
            request.sigResponse === "" &&
            request.sntDisconnectionRequired === true &&
            request.powerBlockRequired === true &&
            request.trdActionsNeeded === true
        ) {
            overAllStatus = "with s&t for disconnection.";
        } else if (
            isAccept === true &&
            request.oheResponse === "" &&
            request.trdActionsNeeded === false &&
            request.powerBlockRequired === true &&
            request.sntDisconnectionRequired === true &&
            request.sigActionsNeeded === true
        ) {
            overAllStatus = "with trd for disconnection.";
        } else if (
            isAccept === true &&
            request.oheResponse === "" &&
            request.trdActionsNeeded === false &&
            request.powerBlockRequired === true &&
            request.sntDisconnectionRequired === false
        ) {
            overAllStatus = "with trd for disconnection.";
        } else if (
            isAccept === true &&
            request.sigActionsNeeded === true &&
            request.isSanctioned === false &&
            request.optimizeStatus === false &&
            request.powerBlockRequired === false
        ) {
            overAllStatus = "with optg.";
        } else if (
            isAccept === true &&
            request.sigActionsNeeded === false &&
            request.isSanctioned === false &&
            request.optimizeStatus === false &&
            request.powerBlockRequired === false
        ) {
            overAllStatus = "with optg.";
        } else if (
            isAccept === true &&
            request.trdActionsNeeded === true &&
            request.isSanctioned === false &&
            request.optimizeStatus === false &&
            request.sntDisconnectionRequired === false
        ) {
            overAllStatus = "with optg.";
        } else if (
            isAccept === true &&
            request.trdActionsNeeded === true &&
            request.sigActionsNeeded === true &&
            request.isSanctioned === false &&
            request.optimizeStatus === false
        ) {
            overAllStatus = "with optg.";
        } else if (
            isAccept === true &&
            request.oheResponse !== "" &&
            request.trdActionsNeeded === false &&
            request.powerBlockRequired === true
        ) {
            overAllStatus = "return to applicant by trd.";
        } else if (
            isAccept === false &&
            request.oheResponse !== "" &&
            request.remarkByManager === "" &&
            request.trdActionsNeeded === false &&
            request.powerBlockRequired === true
        ) {
            overAllStatus = "return to applicant by trd.";
        } else if (
            isAccept === false &&
            request.sigActionsNeeded === false &&
            request.remarkByManager === "" &&
            request.sigResponse !== "" &&
            request.oheResponse !== "" &&
            request.trdActionsNeeded === false
        ) {
            overAllStatus = "return to applicant by s&t and trd.";
        } else if (
            isAccept === true &&
            request.sigActionsNeeded === false &&
            request.sigResponse !== "" &&
            request.sntDisconnectionRequired === true
        ) {
            overAllStatus = "return to applicant by s&t.";
        } else if (
            isAccept === false &&
            request.sigActionsNeeded === false &&
            request.remarkByManager === "" &&
            request.sigResponse !== "" &&
            request.sntDisconnectionRequired === true
        ) {
            overAllStatus = "return to applicant by s&t.";
        } else if (
            isAccept === false &&
            request.sigActionsNeeded === false &&
            request.remarkByManager !== "" &&
            request.sigResponse !== "" &&
            request.sntDisconnectionRequired === true
        ) {
            overAllStatus = "return to applicant by dept controller.";
        }

        // 3. Build update payload
        const data = {
            managerAcceptance: isAccept,
            managerAcceptanceId: managerId,
            status: isAccept ? "APPROVED" : "REJECTED",
            remarkByManager: remark ?? null,
            overAllStatus,
            managerResponseTiming: new Date(),

            ...(mobileView && {
                adminRequestStatus: "ACCEPTED",
                adminAcceptance: true,
                adminAcceptanceId: adminId,
            }),
        };

        // 4. Persist
        const updated = await prisma.request.update({
            where: { id: requestId },
            data,
        });

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
) => {
    const request = await prisma.request.findUnique({
        where: { id: requestId },
    });

    if (!request) {
        throw new Error("Request not found");
    }

    const updateData = {
        adminAcceptance: acceptance,
        adminAcceptanceId: adminId,
        adminRequestStatus: acceptance ? "ACCEPTED" : "REJECTED",
        overAllStatus: acceptance ? "Sanctioned" : "return to applicant by optg",
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
    const userIds = await fetchChildIds(juniorIds, "USER");

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
export const saveOptimizedData = async (optimizedData) => {
    try {
        // First, create the optimized records
        const created = await prisma.optimize_Table.createMany({
            data: optimizedData.map((request) => {
                // Combine date with time for proper DateTime format
                const timeFrom = new Date(`${request.date}T${request.optimisedTimeFrom}:00`);
                const timeTo = new Date(`${request.date}T${request.optimisedTimeTo}:00`);

                return {
                    id: request.id,
                    optimizeTimeFrom: timeFrom,
                    optimizeTimeTo: timeTo,
                    date: new Date(request.date),
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
                const timeFrom = new Date(`${request.date}T${request.optimisedTimeFrom}:00`);
                const timeTo = new Date(`${request.date}T${request.optimisedTimeTo}:00`);

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
    });
    if (!request) {
        throw new Error("Request not found");
    }
    return await prisma.request.update({
        where: { id },
        data: {
            userResponse: "ACCEPTED",
            userAcceptanceForSanction: true,
        },
    });
};

export const userRequestRemarkReject = async (id, remark) => {
    const request = await prisma.request.findUnique({
        where: { id },
    });
    if (!request) {
        throw new Error("Request not found");
    }
    return await prisma.request.update({
        where: { id },
        data: {
            userAcceptanceForSanction: false,
            isSanctioned: false,
            userResponse: remark,
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
