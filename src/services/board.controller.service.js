import prisma from "../prisma/index.js";

export const getSanctionedRequestsByTimeRange = async (hours) => {
    // Validate hours input
    if (![8, 16, 24].includes(hours)) {
        throw new Error("Invalid hours value. Must be 8, 16, or 24.");
    }

    // Get current time
    const now = new Date();

    // Calculate end date/time (X hours from now)
    const endDate = new Date(now);
    endDate.setHours(now.getHours() + hours);

    try {
        const requests = await prisma.request.findMany({
            where: {
                isSanctioned: true,
                OR: [
                    // Jobs starting within the next X hours
                    {
                        sanctionedTimeFrom: {
                            gte: now,
                            lte: endDate,
                        },
                    },
                    // Jobs ending within the next X hours
                    {
                        sanctionedTimeTo: {
                            gte: now,
                            lte: endDate,
                        },
                    },
                    // Jobs currently ongoing
                    {
                        sanctionedTimeFrom: {
                            lte: now,
                        },
                        sanctionedTimeTo: {
                            gte: now,
                        },
                    },
                ],
            },
            select: {
                id: true,
                date: true,
                divisionId: true,
                corridorType: true,
                selectedDepartment: true,
                selectedSection: true,
                stationID: true,
                missionBlock: true,
                workType: true,
                activity: true,
                workLocationFrom: true,
                workLocationTo: true,
                sanctionedTimeFrom: true,
                sanctionedTimeTo: true,
                processedLineSections: true,
                requestremarks: true,
                sanctionedRemarks: true,
                overAllStatus: true,
                status: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        department: true,
                        phone: true,
                    },
                },
            },
            orderBy: {
                sanctionedTimeFrom: "asc",
            },
        });

        return {
            total: requests.length,
            requests: requests,
        };
    } catch (error) {
        console.error("Error fetching sanctioned requests:", error);
        throw new Error("Failed to fetch sanctioned requests");
    }
};
