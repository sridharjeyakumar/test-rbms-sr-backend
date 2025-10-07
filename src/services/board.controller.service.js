import prisma from "../prisma/index.js";

export const getSanctionedRequestsByTimeRange = async (hours, sections = null) => {
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
        // For better clarity, let's log the exact time range we're querying
        console.log("Fetching requests from:", now.toISOString(), "to:", endDate.toISOString());

        // Build where clause with base conditions
        const whereClause = {
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
                // Jobs that span over our time window (start before now and end after now)
                {
                    sanctionedTimeFrom: {
                        lt: now,
                    },
                    sanctionedTimeTo: {
                        gt: now,
                    },
                },
            ],
        };

        // Add sections filter if provided
        if (sections && Array.isArray(sections) && sections.length > 0) {
            // Process each section to ensure we have an array of individual section strings
            let flattenedSections = [];

            sections.forEach((section) => {
                if (typeof section === "string") {
                    // If section contains commas, it might still be a comma-separated list
                    if (section.includes(",")) {
                        const splitSections = section
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                        flattenedSections = [...flattenedSections, ...splitSections];
                    } else {
                        flattenedSections.push(section);
                    }
                }
            });

            if (flattenedSections.length > 0) {
                whereClause.selectedSection = {
                    in: flattenedSections,
                };
            }
        }

        console.log("Where Clause:", JSON.stringify(whereClause, null, 2));

        const requests = await prisma.request.findMany({
            where: whereClause,
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

        // Format dates in IST for better readability
        const formattedRequests = requests.map((request) => {
            const formattedRequest = { ...request };

            // Format sanctionedTimeFrom to readable IST format
            if (formattedRequest.sanctionedTimeFrom) {
                const sanctionedTimeFrom = new Date(formattedRequest.sanctionedTimeFrom);
                formattedRequest.sanctionedTimeFromIST = sanctionedTimeFrom.toLocaleString(
                    "en-IN",
                    {
                        timeZone: "Asia/Kolkata",
                        dateStyle: "medium",
                        timeStyle: "short",
                    },
                );
            }

            // Format sanctionedTimeTo to readable IST format
            if (formattedRequest.sanctionedTimeTo) {
                const sanctionedTimeTo = new Date(formattedRequest.sanctionedTimeTo);
                formattedRequest.sanctionedTimeToIST = sanctionedTimeTo.toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                });
            }

            return formattedRequest;
        });

        return {
            total: formattedRequests.length,
            timeRange: {
                from: now.toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                }),
                to: endDate.toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                }),
            },
            requests: formattedRequests,
        };
    } catch (error) {
        console.error("Error fetching sanctioned requests:", error);
        throw new Error("Failed to fetch sanctioned requests");
    }
};
