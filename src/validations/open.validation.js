import { z } from "zod";

export const getSanctionedRequestsSchema = z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    CUG: z.string().optional(),
    availedResponse: z.enum(["true", "false", "null"]).optional().default("null"),
});

export const patchSanctionedRequestSchema = z.object({
    // ID remains in query params
    id: z.string().min(1, "id is required"),
    availed: z.boolean().optional().nullable(),
    // New fields for availed=true case
    availedTimeFrom: z.string().optional(),
    availedTimeTo: z.string().optional(),
    // New field for availed=false case
    availedRemarks: z.string().optional(),
    // Added new fields for granted time
    grantedFromTime: z.string().optional(),
    grantedToTime: z.string().optional(),
    overAllStatus: z.string().optional(),
    // Station ID field
    stationID: z.string().optional(),
    // Phone number (CUG) of the person who availed the block
    availedCug: z.string().optional(),
    // SNT disconnection availed times
    sntDisconnectionAvailedTimeFrom: z.string().optional(),
    sntDisconnectionAvailedTimeTo: z.string().optional(),
    // TRD disconnection availed times
    trdDisconnectionAvailedTimeFrom: z.string().optional(),
    trdDisconnectionAvailedTimeTo: z.string().optional(),
    // Is granted flag
    isGranted: z.boolean().optional(),
    isApplied: z.boolean().optional(),
    blockBurst: z.boolean().optional(),
    AppliedTimeFrom: z.string().optional(),
    AppliedTimeTo: z.string().optional(),
});

export const updateTrainArrivalSchema = z.object({
    reference_station: z.string().min(1, "Reference station is required"),
    train_number: z.string().min(1, "Train number is required"),
});
