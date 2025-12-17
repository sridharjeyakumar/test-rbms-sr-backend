import * as trafficControllerService from "../services/traffic.controller.service.js";
import { handleError, successResponse } from "../utils/response.js";
import * as trafficControllerValidation from "../validations/traffic.controller.validation.js";

export const getAllUsers = async (req, res) => {
    try {
        const trafficControllerId = req.user.id;
        const users = await trafficControllerService.getAllUsers(trafficControllerId);
        return successResponse(res, 200, "Users retrieved successfully", users);
    } catch (error) {
        handleError(error, res);
    }
};

export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = trafficControllerValidation.updateUserSchema.parse(req.body);
        const updatedUser = await trafficControllerService.updateUser(userId, updateData);
        return successResponse(res, 200, "User updated successfully", updatedUser);
    } catch (error) {
        handleError(error, res);
    }
};

export const checkPhoneExists = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) {
            return successResponse(res, 400, "Phone number is required");
        }

        const exists = await trafficControllerService.checkPhoneExists(phone);
        return successResponse(res, 200, "Phone number availability checked", { exists });
    } catch (error) {
        handleError(error, res);
    }
};
// Check if an email already exists
export const checkEmailExists = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return successResponse(res, 400, "Email is required");
        }
        const exists = await trafficControllerService.checkEmailExists(email);
        return successResponse(res, 200, "Email availability checked", { exists });
    } catch (error) {
        handleError(error, res);
    }
};
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const deptControllerId = req.user.id;
        const result = await trafficControllerService.deleteUser(userId, deptControllerId);
        return successResponse(res, 200, result.message, result);
    } catch (error) {
        handleError(error, res);
    }
};
export const createUser = async (req, res) => {
    try {
        const userData = trafficControllerValidation.createUserSchema.parse(req.body);
        const location = req.user.location;
        const adminId = req.user.id;
        const newUser = await trafficControllerService.createUser(userData, location, adminId);
        return successResponse(res, 201, "User created successfully", newUser);
    } catch (error) {
        handleError(error, res);
    }
};
