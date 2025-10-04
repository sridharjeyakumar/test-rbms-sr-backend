import {
    fetchSanctionedRequests,
    updateSanctionedRequestAvailed,
    updateTrainArrival,
} from "../services/open.service.js";
import {
    getSanctionedRequestsSchema,
    patchSanctionedRequestSchema,
    updateTrainArrivalSchema,
} from "../validations/open.validation.js";
import { handleError, successResponse } from "../utils/response.js";

export const getSanctionedRequests = async (req, res) => {
    try {
        const { start_date, end_date, CUG, availedResponse } = getSanctionedRequestsSchema.parse(
            req.query,
        );

        // Convert string to appropriate type
        let availedResponseValue = null;
        if (availedResponse === "true") availedResponseValue = true;
        else if (availedResponse === "false") availedResponseValue = false;

        const sanctionedRequests = await fetchSanctionedRequests(
            start_date,
            end_date,
            CUG,
            availedResponseValue,
        );
        return successResponse(
            res,
            200,
            "Sanctioned requests fetched successfully",
            sanctionedRequests,
        );
    } catch (error) {
        handleError(error, res);
    }
};

export const patchSanctionedRequest = async (req, res) => {
    try {
        // Get ID from query params
        const { id } = patchSanctionedRequestSchema.pick({ id: true }).parse(req.query);

        // Get other fields from body
        const {
            availed,
            availedTimeFrom,
            availedTimeTo,
            availedRemarks,
            grantedFromTime,
            grantedToTime,
            overAllStatus,
            availedCug,
            sntDisconnectionAvailedTimeFrom,
            sntDisconnectionAvailedTimeTo,
            trdDisconnectionAvailedTimeFrom,
            trdDisconnectionAvailedTimeTo,
            isGranted,
        } = patchSanctionedRequestSchema.omit({ id: true }).parse(req.body);

        const updatedRequest = await updateSanctionedRequestAvailed(id, availed, {
            availedTimeFrom,
            availedTimeTo,
            availedRemarks,
            grantedFromTime,
            grantedToTime,
            overAllStatus,
            availedCug,
            sntDisconnectionAvailedTimeFrom,
            sntDisconnectionAvailedTimeTo,
            trdDisconnectionAvailedTimeFrom,
            trdDisconnectionAvailedTimeTo,
            isGranted,
        });

        return successResponse(res, 200, "Sanctioned request updated successfully", updatedRequest);
    } catch (error) {
        handleError(error, res);
    }
};

// export const patchSanctionedRequest = async (req, res) => {
//     try {
//         const { id } = patchSanctionedRequestSchema.pick({ id: true }).parse(req.query);
//         const { availed } = patchSanctionedRequestSchema.pick({ availed: true }).parse(req.body);

//         const updatedRequest = await updateSanctionedRequestAvailed(id, availed);
//         return successResponse(res, 200, "Sanctioned request updated successfully", updatedRequest);
//     } catch (error) {
//         handleError(error, res);
//     }
// };

export const patchTrainArrival = async (req, res) => {
    try {
        const { reference_station, train_number } = updateTrainArrivalSchema.parse(req.query);

        const updatedTrain = await updateTrainArrival(reference_station, train_number);

        return successResponse(res, 200, "Train arrival updated successfully", updatedTrain);
    } catch (error) {
        handleError(error, res);
    }
};
