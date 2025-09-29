import prisma from "../prisma/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load track machines data
const trackMachinesPath = path.join(__dirname, "..", "data", "noOfTrackMachines.json");
const trackMachinesData = JSON.parse(fs.readFileSync(trackMachinesPath, "utf8"));

export const fetchSanctionedRequests = async (startDate, endDate, CUG, availedResponse = null) => {
    const where = {
        isSanctioned: true,
    };

    // Handle availedResponse filtering
    if (availedResponse === null) {
        where.availedResponse = null;
    } else if (availedResponse === true) {
        where.availedResponse = "true";
    } else if (availedResponse === false) {
        where.availedResponse = "false";
    }

    if (startDate) {
        where.sanctionedTimeFrom = { gte: new Date(startDate) };
    }
    if (endDate) {
        where.sanctionedTimeTo = Object.assign(where.sanctionedTimeTo || {}, {
            lte: new Date(endDate),
        });
    }

    if (CUG) {
        where.user = {
            phone: CUG,
        };
    }

    const requests = await prisma.request.findMany({
        where,
        select: {
            id: true,
            divisionId: true,
            date: true,
            selectedDepartment: true,
            selectedSection: true,
            stationID: true,
            missionBlock: true,
            workType: true,
            activity: true,
            sanctionedTimeFrom: true,
            sanctionedTimeTo: true,
            demandTimeFrom: true,
            demandTimeTo: true,
            status: true,
            userStatus: true,
            remarkByManager: true,
            userResponse: true,
            createdAt: true,
            workLocationFrom: true,
            workLocationTo: true,
            freshCautionRequired: true,
            freshCautionSpeed: true,
            freshCautionLocationFrom: true,
            freshCautionLocationTo: true,
            adjacentLinesAffected: true,
            sigDisconnection: true,
            sntDisconnectionRequired: true,
            elementarySection: true,
            elementarySectionTo: true,
            sigElementarySectionFrom: true,
            sigElementarySectionTo: true,
            powerBlockRequired: true,
            processedLineSections: true,
            userId: true,
            overAllStatus: true,
            AvailedTimeFrom: true,
            AvailedTimeTo: true,
            availedResponse: true,
            sntDisconnectionAssignTo: true,
            powerBlockDisconnectionAssignTo: true,
            availedById: true,
            availedBy: {
                select: {
                    name: true,
                    phone: true,
                    email: true,
                    department: true,
                    location: true,
                },
            },
            user: {
                select: {
                    name: true,
                    phone: true,
                    email: true,
                    department: true,
                    location: true,
                },
            },
        },
        orderBy: {
            sanctionedTimeFrom: "asc",
        },
    });

    return requests.map((request) => {
        // Arrays to collect multiple values
        const upOrDownOrSLValues = [];
        const roadNumberValues = [];
        const otherLinesValues = []; // For storing processed other lines

        if (request.processedLineSections) {
            // Parse the JSON if it's a string
            const lineSections =
                typeof request.processedLineSections === "string"
                    ? JSON.parse(request.processedLineSections)
                    : request.processedLineSections;

            // Process each line section
            if (Array.isArray(lineSections)) {
                lineSections.forEach((section) => {
                    // For line or regular type
                    if (section.type === "regular" || section.type === "line") {
                        // For regular type, collect lineName values
                        if (section.lineName && section.lineName.trim() !== "") {
                            upOrDownOrSLValues.push(section.lineName);
                        }

                        // Process other lines - handle already comma-separated values
                        if (section.otherLines && section.otherLines.trim() !== "") {
                            // Split by commas and add each item individually
                            const otherLinesItems = section.otherLines.split(",");
                            otherLinesItems.forEach((item) => {
                                const trimmedItem = item.trim();
                                if (trimmedItem) {
                                    otherLinesValues.push(trimmedItem);
                                }
                            });
                        }
                    } else if (section.type === "yard") {
                        // For yard type, collect road numbers
                        if (section.road && section.road.trim() !== "") {
                            // Extract only the number from "Rd X" format
                            const roadMatch = section.road.match(/\d+/);
                            if (roadMatch) {
                                roadNumberValues.push(roadMatch[0]);
                            }
                        }

                        // Process other roads - handle already comma-separated values
                        if (section.otherRoads && section.otherRoads.trim() !== "") {
                            const otherRoadsItems = section.otherRoads.split(",");
                            otherRoadsItems.forEach((item) => {
                                const trimmedItem = item.trim();
                                if (trimmedItem) {
                                    otherLinesValues.push(trimmedItem);
                                }
                            });
                        }
                    }
                });
            }
        }

        // Check if activity matches any track machine type
        let noOfTrackMachines = undefined;
        if (request.activity) {
            // Look for exact match first
            if (trackMachinesData[request.activity]) {
                noOfTrackMachines = trackMachinesData[request.activity];
            } else {
                // Look for partial match (activity might contain the machine type)
                for (const machineType in trackMachinesData) {
                    if (request.activity.includes(machineType)) {
                        noOfTrackMachines = trackMachinesData[machineType];
                        break;
                    }
                }
            }
        }

        // Create a new object with the transformed field names
        return {
            id: request.divisionId,
            date: request.date,
            department: request.selectedDepartment,
            section: request.selectedSection,
            stationID: request.stationID,
            blockSectionOrYard: request.missionBlock,
            workType: request.workType,
            activity: request.activity,
            sanctionedTimeFrom: request.sanctionedTimeFrom,
            sanctionedTimeTo: request.sanctionedTimeTo,
            requestedTimeFrom: request.demandTimeFrom,
            requestedTimeTo: request.demandTimeTo,
            status: request.status,
            userStatus: request.userStatus,
            remarkByManager: request.remarkByManager,
            userResponse: request.userResponse,
            createdAt: request.createdAt,
            locationMastFrom: request.workLocationFrom,
            locationMastTo: request.workLocationTo,
            cautionRequired: request.freshCautionRequired,
            kmph: request.freshCautionSpeed,
            cautionLocationFrom: request.freshCautionLocationFrom,
            cautionLocationTo: request.freshCautionLocationTo,
            adjacentLinesAffected: request.adjacentLinesAffected, // Keep original field
            sigDisconnection: request.sigDisconnection,
            disconnectionRequired: request.sntDisconnectionRequired,
            elementarySection: request.elementarySection,
            elementarySectionTo: request.elementarySectionTo,
            sigElementarySectionFrom: request.sigElementarySectionFrom,
            sigElementarySectionTo: request.sigElementarySectionTo,
            powerBlockRequired: request.powerBlockRequired,
            availedResponse: request.availedResponse,
            availedTimeFrom: request.AvailedTimeFrom,
            availedTimeTo: request.AvailedTimeTo,
            userId: request.userId,
            sntDisconnectionAssignTo: request.sntDisconnectionAssignTo,
            powerBlockDisconnectionAssignTo: request.powerBlockDisconnectionAssignTo,
            upDrDownOrSL: upOrDownOrSLValues.length > 0 ? upOrDownOrSLValues.join(", ") : undefined,
            roadNumber: roadNumberValues.length > 0 ? roadNumberValues.join(", ") : undefined,
            otherLinesAffected:
                otherLinesValues.length > 0 ? otherLinesValues.join(", ") : undefined,
            // Add noOfTrackMachines field if available
            noOfTrackMachines: noOfTrackMachines,
            overAllStatus: request.overAllStatus,
            user: request.user
                ? {
                      applicantName: request.user.name,
                      applicantMobile: request.user.phone,
                      email: request.user.email || null,
                      department: request.user.department || null,
                      division: request.user.location,
                  }
                : null,
        };
    });
};
export const updateSanctionedRequestAvailed = async (id, availed, additionalData) => {
    const existingRequest = await prisma.request.findUnique({
        where: { divisionId: id },
        select: {
            isSanctioned: true,
        },
    });

    if (!existingRequest) {
        throw new Error("Request not found");
    }

    if (!existingRequest.isSanctioned) {
        throw new Error("Cannot update availedResponse for an unsanctioned request");
    }

    // Prepare update data
    const updateData = {
        availedResponse: String(availed),
        availedById: null, // Default to null, will update if CUG is provided
    };

    // Find user by phone/CUG if provided
    if (additionalData.availedCug) {
        const user = await prisma.user.findFirst({
            where: { phone: additionalData.availedCug },
            select: { id: true },
        });

        if (user) {
            updateData.availedById = user.id;
        }
    }

    // Handle availed=true case
    if (availed === true) {
        updateData.AvailedTimeFrom = additionalData.availedTimeFrom
            ? new Date(additionalData.availedTimeFrom)
            : null;
        updateData.AvailedTimeTo = additionalData.availedTimeTo
            ? new Date(additionalData.availedTimeTo)
            : null;
        updateData.availedRemarks = null; // Clear remarks if availed is true
    }
    // Handle availed=false case
    else {
        updateData.availedRemarks = additionalData.availedRemarks || null;
        updateData.AvailedTimeFrom = null; // Clear times if availed is false
        updateData.AvailedTimeTo = null;
    }

    // Add granted time fields if they exist
    if (additionalData.grantedFromTime) {
        updateData.grantedFromTime = new Date(additionalData.grantedFromTime);
    }

    if (additionalData.grantedToTime) {
        updateData.grantedToTime = new Date(additionalData.grantedToTime);
    }
    if (additionalData.overAllStatus) {
        updateData.overAllStatus = additionalData.overAllStatus;
    }
    // Add stationID if it exists
    if (additionalData.stationID) {
        updateData.stationID = additionalData.stationID;
    }

    const updatedRequest = await prisma.request.update({
        where: { divisionId: id },
        data: updateData,
        select: {
            divisionId: true,
            availedResponse: true,
            AvailedTimeFrom: true,
            AvailedTimeTo: true,
            availedRemarks: true,
            grantedFromTime: true,
            grantedToTime: true,
            overAllStatus: true,
            stationID: true,
            availedById: true,
            availedBy: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    department: true,
                    role: true,
                    location: true,
                },
            },
        },
    });

    return updatedRequest;
};

// export const updateSanctionedRequestAvailed = async (id, availedResponseValue) => {
//     const existingRequest = await prisma.request.findUnique({
//         where: { id },
//         select: {
//             isSanctioned: true,
//         },
//     });

//     if (!existingRequest) {
//         throw new Error("Request not found");
//     }

//     if (!existingRequest.isSanctioned) {
//         throw new Error("Cannot update availedResponse for an unsanctioned request");
//     }

//     const updatedRequest = await prisma.request.update({
//         where: { id },
//         data: {
//             availedResponse: String(availedResponseValue),
//         },
//         select: {
//             id: true,
//             availedResponse: true,
//             sanctionedTimeFrom: true,
//             sanctionedTimeTo: true,
//         },
//     });

//     return updatedRequest;
// };

export const updateTrainArrival = async (referenceStation, trainNumber) => {
    const updatedTrain = await prisma.trainArrival.update({
        where: {
            referenceStation_trainNumber: {
                referenceStation: referenceStation,
                trainNumber: trainNumber,
            },
        },
        data: {
            arrivedOrNot: true,
            arrivedTime: new Date(),
        },
        select: {
            id: true,
            referenceStation: true,
            trainNumber: true,
            arrivedOrNot: true,
            arrivedTime: true,
        },
    });

    return updatedTrain;
};
