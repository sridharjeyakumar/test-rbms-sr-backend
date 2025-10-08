import * as deptControllerValidation from "../validations/dept.controller.validation.js";
import * as deptControllerService from "../services/dept.controller.service.js";
import { handleError, successResponse } from "../utils/response.js";

// Check if a phone number already exists
export const checkPhoneExists = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) {
            return successResponse(res, 400, "Phone number is required");
        }

        const exists = await deptControllerService.checkPhoneExists(phone);
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
        const exists = await deptControllerService.checkEmailExists(email);
        return successResponse(res, 200, "Email availability checked", { exists });
    } catch (error) {
        handleError(error, res);
    }
};
// Get all USER role users under a DEPT_CONTROLLER
export const getAllUsers = async (req, res) => {
    try {
        const deptControllerId = req.user.id;
        const users = await deptControllerService.getAllUsers(deptControllerId);
        return successResponse(res, 200, "Users retrieved successfully", users);
    } catch (error) {
        handleError(error, res);
    }
};

// Get all JE role users under a specific USER
export const getAllJEsUnderUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const JEs = await deptControllerService.getAllJEsUnderUser(userId);
        return successResponse(res, 200, "JEs retrieved successfully", JEs);
    } catch (error) {
        handleError(error, res);
    }
};

// Create a new USER under DEPT_CONTROLLER
export const createUser = async (req, res) => {
    try {
        const userData = deptControllerValidation.createUserSchema.parse(req.body);
        const deptControllerId = req.user.id;
        const newUser = await deptControllerService.createUser(userData, deptControllerId);
        return successResponse(res, 201, "User created successfully", newUser);
    } catch (error) {
        handleError(error, res);
    }
};

// Create a new JE under USER
export const createJE = async (req, res) => {
    try {
        const jeData = deptControllerValidation.createJESchema.parse(req.body);
        const deptControllerId = req.user.id;
        const newJE = await deptControllerService.createJE(jeData, deptControllerId);
        return successResponse(res, 201, "JE created successfully", newJE);
    } catch (error) {
        handleError(error, res);
    }
};

// Update a USER
export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = deptControllerValidation.updateUserSchema.parse(req.body);
        const deptControllerId = req.user.id;
        const updatedUser = await deptControllerService.updateUser(
            userId,
            updateData,
            deptControllerId,
        );
        return successResponse(res, 200, "User updated successfully", updatedUser);
    } catch (error) {
        handleError(error, res);
    }
};

// Update a JE
export const updateJE = async (req, res) => {
    try {
        const { jeId } = req.params;
        const updateData = deptControllerValidation.updateJESchema.parse(req.body);
        const deptControllerId = req.user.id;
        const updatedJE = await deptControllerService.updateJE(jeId, updateData, deptControllerId);
        return successResponse(res, 200, "JE updated successfully", updatedJE);
    } catch (error) {
        handleError(error, res);
    }
};

// Delete a USER (and all JEs under them)
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const deptControllerId = req.user.id;
        const result = await deptControllerService.deleteUser(userId, deptControllerId);
        return successResponse(res, 200, result.message, result);
    } catch (error) {
        handleError(error, res);
    }
};

// Delete a JE
export const deleteJE = async (req, res) => {
    try {
        const { jeId } = req.params;
        const deptControllerId = req.user.id;
        const result = await deptControllerService.deleteJE(jeId, deptControllerId);
        return successResponse(res, 200, result.message, result);
    } catch (error) {
        handleError(error, res);
    }
};
