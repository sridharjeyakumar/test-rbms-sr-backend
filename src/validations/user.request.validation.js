import { z } from "zod";

export const createRequestSchema = z.object({
    adminAcceptance: z.boolean().optional().default(false),
    date: z.string().datetime(),
    emergencyBlockRemarks: z.string().optional(),
    selectedDepartment: z.string(),
    selectedSection: z.string(),
    stationID: z.string().optional(),
    missionBlock: z.string(),
    workType: z.string(),
    activity: z.string(),
    workLocationFrom: z.string().optional(),
    workLocationTo: z.string().optional(),
    demandTimeFrom: z.string().datetime(),
    demandTimeTo: z.string().datetime(),
    duration: z.string().datetime().optional().nullable(),
    sigDisconnection: z.boolean().optional(),
    workNature: z.string().optional(),
    // elementarySectionFrom: z.string().optional(),
    adjacentLinesAffected: z.string().optional(),
    elementarySection: z.string().optional(),
    elementarySectionTo: z.string().optional(),
    sigElementarySectionFrom: z.string().optional(),
    sigElementarySectionTo: z.string().optional(),
    repercussions: z.string().optional(),
    // otherLinesAffected: z.any().optional(), // JSON data
    requestremarks: z.string().optional(),
    selectedDepo: z.string().optional(),
    sigResponse: z.string().optional().default("yes"),
    sntDisconnectionRequired: z.boolean().optional(),
    powerBlockRequired: z.boolean().optional(),
    freshCautionRequired: z.boolean().optional(),
    freshCautionLocationFrom: z.string().optional(),
    freshCautionLocationTo: z.string().optional(),
    sntDisconnectionLineTo: z.string().optional(),
    freshCautionSpeed: z.number().optional(),
    sntDisconnectionLineFrom: z.string().optional(),
    sntDisconnectionAssignTo: z.string().optional(),
    sntDisconnectionRequirements: z.array(z.string().optional()).optional(),
    powerBlockRequirements: z.array(z.string().optional()).optional(),
    ohDisconnection: z.string().optional(),
    oheDisconnection: z.string().optional(),
    oheResponse: z.string().optional().default("yes"),
    corridorType: z.string().optional().default("corridor"),
    sigActionsNeeded: z.boolean().optional().default(true),
    processedLineSections: z
        .array(
            z.object({
                block: z.string(),
                type: z.string(),
                lineName: z.string(),
                otherLines: z.string(),
                stream: z.string(),
                road: z.string(),
                otherRoads: z.string(),
            }),
        )
        .optional(),
    trdActionsNeeded: z.boolean().optional().default(true),
    trdWorkLocation: z.string().optional(),
    repercussions: z.string().optional(),
    sigDisconnectionRequirements: z.string().optional(),
    trdDisconnectionRequirements: z.string().optional(),
    trdDisconnectionAssignTo: z.string().optional(),
    powerBlockDisconnectionAssignTo: z.string().optional(),
    routeFrom: z.string().optional(),
    routeTo: z.string().optional(),
    managerAcceptance: z.boolean().optional().default(false),
    isSanctioned: z.boolean().optional().default(false),
});

export const updateRequestSchema = createRequestSchema.partial();

export const requestIdSchema = z.object({
    id: z.string().uuid(),
});

export const requestStatusSchema = z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    ManagerResponse: z.string().optional(),
});

export const updateOtherRequestSchema = z.object({
    disconnectionRequestRejectRemarks: z.string().optional(),
});
