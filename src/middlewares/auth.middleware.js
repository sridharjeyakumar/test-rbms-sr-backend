import jwt from "jsonwebtoken";
import prisma from "../prisma/index.js";

export const authenticateToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                status: false,
                message: "No token provided",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            status: false,
            message: "Invalid token",
        });
    }
};

export const adminMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                status: false,
                message: "No token provided",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (
            !user ||
            (user.role !== "ADMIN" &&
                user.role !== "SUPER_ADMIN" &&
                user.role !== "PUNCTUALITY_CONTROLLER")
        ) {
            return res.status(403).json({
                status: false,
                message: "Access denied. Admin privileges required.",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            status: false,
            message: "Invalid token",
        });
    }
};

export const managerMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                status: false,
                message: "No token provided",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (
            !user ||
            (user.role !== "BRANCH_OFFICER" &&
                user.role !== "DEPT_CONTROLLER" &&
                user.role !== "SENIOR_OFFICER" &&
                user.role !== "JUNIOR_OFFICER" &&
                user.role !== "ADMIN" &&
                user.role !== "PUNCTUALITY_CONTROLLER" &&
                user.role !== "SUPER_ADMIN")
        ) {
            return res.status(403).json({
                status: false,
                message: "Access denied. Manager privileges required.",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            status: false,
            message: "Invalid token",
        });
    }
};

export const DRMorHQMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                status: false,
                message: "No token provided",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });
        console.log(user);

        if (
            !user ||
            (user.role !== "DRM" &&
                user.role !== "PUNCTUALITY_CONTROLLER" &&
                user.role !== "HQ" &&
                user.role !== "BRANCH_OFFICER" &&
                user.role !== "DEPT_CONTROLLER" &&
                user.role !== "SENIOR_OFFICER" &&
                user.role !== "JUNIOR_OFFICER" &&
                user.role !== "ADMIN" &&
                user.role !== "USER" &&
                user.role !== "SUPER_ADMIN")
        ) {
            return res.status(403).json({
                status: false,
                message: "Access denied. Manager privileges required.",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            status: false,
            message: "Invalid token",
        });
    }
};

const PLATTERLABS_API_KEY = process.env.OPEN_API_KEY;
const ETSR_API_KEY = process.env.OPEN_API_ETSR;

export const platterLabsApiKeyMiddleware = (req, res, next) => {
    const apiKey = req.header("x-api-key");
    if (apiKey !== PLATTERLABS_API_KEY) {
        return res.status(403).json({ message: "Forbidden - Invalid API Key" });
    }
    next();
};

export const etsrApiKeyMiddleware = (req, res, next) => {
    const apiKey = req.header("x-api-key");
    if (apiKey !== ETSR_API_KEY) {
        return res.status(403).json({ message: "Forbidden - Invalid API Key" });
    }
    next();
};

export const boardControllerMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                status: false,
                message: "No token provided",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (!user || user.role !== "BOARD_CONTROLLER") {
            return res.status(403).json({
                status: false,
                message: "Access denied. Board Controller privileges required.",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            status: false,
            message: "Invalid token",
        });
    }
};
