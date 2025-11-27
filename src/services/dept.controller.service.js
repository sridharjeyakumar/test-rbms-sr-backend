import prisma from "../prisma/index.js";
import { hashPassword } from "../utils/password.utils.js";

// Check if phone number exists in any user
export const checkPhoneExists = async (phone) => {
    const existingUser = await prisma.user.findFirst({
        where: {
            phone: phone,
        },
        select: {
            id: true,
            name: true,
            role: true,
        },
    });

    return !!existingUser;
};

// Check if email exists in any user
export const checkEmailExists = async (email) => {
    const existingUser = await prisma.user.findUnique({
        where: {
            email: email,
        },
        select: {
            id: true,
            name: true,
            role: true,
        },
    });
    return !!existingUser;
};

// Format user data for response
const formatUserData = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone,
    location: user.location,
    depot: user.depot,
    createdAt: user.createdAt,
    managerId: user.managerId,
});

// Get all users in the hierarchy under a DEPT_CONTROLLER
export const getAllUsers = async (deptControllerId) => {
    // First, get all SENIOR_OFFICER users directly under the DEPT_CONTROLLER
    const seniorOfficers = await prisma.user.findMany({
        where: {
            managerId: deptControllerId,
            role: "SENIOR_OFFICER",
        },
    });

    let allUsers = [...seniorOfficers];

    // For each SENIOR_OFFICER, get their JUNIOR_OFFICERs
    for (const seniorOfficer of seniorOfficers) {
        const juniorOfficers = await prisma.user.findMany({
            where: {
                managerId: seniorOfficer.id,
                role: "JUNIOR_OFFICER",
            },
        });

        allUsers = [...allUsers, ...juniorOfficers];

        // For each JUNIOR_OFFICER, get their USERs
        for (const juniorOfficer of juniorOfficers) {
            const users = await prisma.user.findMany({
                where: {
                    managerId: juniorOfficer.id,
                    role: "USER",
                },
            });

            allUsers = [...allUsers, ...users];
        }
    }

    // SSE directly under DEPT_CONTROLLER
    const directUsers = await prisma.user.findMany({
        where: {
            managerId: deptControllerId,
            role: "USER",
        },
    });

    allUsers = [...allUsers, ...directUsers];

    // Filter out users with depot === 'OVERALL'
    const filteredUsers = allUsers.filter((u) => u.depot !== "OVERALL");

    // Sort by creation date
    filteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return filteredUsers.map(formatUserData);
};

// Get all JE role users under a specific USER
export const getAllJEsUnderUser = async (userId) => {
    // First verify that the userId belongs to a USER role
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
            role: "USER",
        },
    });

    if (!user) {
        throw new Error("User not found or is not a USER role");
    }

    const JEs = await prisma.user.findMany({
        where: {
            managerId: userId,
            role: "JE",
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return JEs.map(formatUserData);
};

// Create a new USER under DEPT_CONTROLLER
export const createUser = async (userData, deptControllerId, location) => {
    // Check if phone number already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            phone: userData.phone,
        },
    });

    if (existingUser) {
        throw new Error("Phone number already exists");
    }
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
        where: {
            email: userData.email,
        },
    });
    if (existingEmail) {
        throw new Error("Email already exists");
    }

    // Hash the password
    const hashedPassword = await hashPassword(userData.depot);

    // Get department from deptController
    const deptController = await prisma.user.findUnique({
        where: { id: deptControllerId },
        select: { department: true },
    });

    // Create the new USER
    const newUser = await prisma.user.create({
        data: {
            ...userData,
            role: "USER",
            location: location || userData.depot,
            managerId: deptControllerId,
            password: hashedPassword,
            department: deptController?.department || null,
        },
    });

    return formatUserData(newUser);
};

// Create a new JE under USER
export const createJE = async (jeData, deptControllerId) => {
    // First verify that the managerId (USER) belongs to a USER role
    const user = await prisma.user.findFirst({
        where: {
            id: jeData.managerId,
            role: "USER",
        },
    });

    if (!user) {
        throw new Error("User not found");
    }
    // Check if phone number already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            phone: jeData.phone,
        },
    });

    if (existingUser) {
        throw new Error("Phone number already exists");
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
        where: {
            email: jeData.email,
        },
    });

    if (existingEmail) {
        throw new Error("Email already exists");
    }

    // Hash the password
    const hashedPassword = await hashPassword(jeData.depot);

    // Get department from deptController
    const deptController = await prisma.user.findUnique({
        where: { id: deptControllerId },
        select: { department: true },
    });

    // Create the new JE
    const newJE = await prisma.user.create({
        data: {
            ...jeData,
            role: "JE",
            location: jeData.depot,
            password: hashedPassword,
            department: deptController?.department || null,
        },
    });

    return formatUserData(newJE);
};

// Update a USER
export const updateUser = async (userId, updateData) => {
    // Check if the user exists
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            role: "USER",
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Check if updating email and if it already exists
    if (updateData.email && updateData.email !== user.email) {
        const existingEmail = await prisma.user.findUnique({
            where: {
                email: updateData.email,
            },
        });

        if (existingEmail) {
            throw new Error("Email already exists");
        }
    }

    // Check if updating phone and if it already exists
    if (updateData.phone && updateData.phone !== user.phone) {
        const existingPhone = await prisma.user.findFirst({
            where: {
                phone: updateData.phone,
            },
        });

        if (existingPhone) {
            throw new Error("Phone number already exists");
        }
    }

    // Update the USER
    const updatedUser = await prisma.user.update({
        where: {
            id: userId,
        },
        data: updateData,
    });

    return formatUserData(updatedUser);
};

// Update a JE
export const updateJE = async (jeId, updateData, deptControllerId) => {
    // Check if the JE exists
    const je = await prisma.user.findUnique({
        where: {
            id: jeId,
            role: "JE",
        },
        include: {
            manager: true,
        },
    });

    if (!je) {
        throw new Error("JE not found");
    }

    if (updateData.managerId) {
        const newManager = await prisma.user.findFirst({
            where: {
                id: updateData.managerId,
                role: "USER",
            },
        });

        if (!newManager) {
            throw new Error("New manager not found");
        }
    }

    // Check if updating email and if it already exists
    if (updateData.email && updateData.email !== je.email) {
        const existingEmail = await prisma.user.findUnique({
            where: {
                email: updateData.email,
            },
        });

        if (existingEmail) {
            throw new Error("Email already exists");
        }
    }

    // Check if updating phone and if it already exists
    if (updateData.phone && updateData.phone !== je.phone) {
        const existingPhone = await prisma.user.findFirst({
            where: {
                phone: updateData.phone,
            },
        });

        if (existingPhone) {
            throw new Error("Phone number already exists");
        }
    }

    // Update the JE
    const updatedJE = await prisma.user.update({
        where: {
            id: jeId,
        },
        data: updateData,
    });

    return formatUserData(updatedJE);
};

// Delete a USER (and all JEs under them)
// export const deleteUser = async (userId) => {
//     // Check if the user exists
//     const user = await prisma.user.findFirst({
//         where: {
//             id: userId,
//             role: "USER",
//         },
//     });

//     if (!user) {
//         throw new Error("User not found");
//     }

//     // Delete all JEs under this USER first
//     await prisma.user.deleteMany({
//         where: {
//             managerId: userId,
//             role: "JE",
//         },
//     });

//     // Delete the USER
//     await prisma.user.delete({
//         where: {
//             id: userId,
//         },
//     });

//     return { success: true, message: "User and all related JEs deleted successfully" };
// };

export const deleteUser = async (userId) => {
    // 1️⃣ Find user
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            role: "USER",
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // 2️⃣ Delete USER OTPs
    await prisma.otp.deleteMany({
        where: { userId },
    });

    // 3️⃣ Delete USER refresh tokens
    await prisma.refreshToken.deleteMany({
        where: { userId },
    });

    // 4️⃣ Find all JEs under this USER
    const jes = await prisma.user.findMany({
        where: { managerId: userId, role: "JE" },
        select: { id: true },
    });

    const jeIds = jes.map((je) => je.id);

    if (jeIds.length > 0) {
        // 5️⃣ Delete OTPs of all JEs
        await prisma.otp.deleteMany({
            where: { userId: { in: jeIds } },
        });

        // 6️⃣ Delete RefreshTokens of all JEs
        await prisma.refreshToken.deleteMany({
            where: { userId: { in: jeIds } },
        });

        // 7️⃣ Delete JE users
        await prisma.user.deleteMany({
            where: { id: { in: jeIds } },
        });
    }

    // 8️⃣ Delete the USER
    await prisma.user.delete({
        where: { id: userId },
    });

    return {
        success: true,
        message: "User and related JEs deleted successfully",
    };
};

// Delete a JE
// export const deleteJE = async (jeId, deptControllerId) => {
//     // Check if the JE exists
//     const je = await prisma.user.findUnique({
//         where: {
//             id: jeId,
//             role: "JE",
//         },
//         include: {
//             manager: true,
//         },
//     });

//     if (!je) {
//         throw new Error("JE not found");
//     }

//     // Delete the JE
//     await prisma.user.delete({
//         where: {
//             id: jeId,
//         },
//     });

//     return { success: true, message: "JE deleted successfully" };
// };
export const deleteJE = async (jeId, deptControllerId) => {
    // 1️⃣ Check if the JE exists
    const je = await prisma.user.findFirst({
        where: {
            id: jeId,
            role: "JE",
        },
        include: {
            manager: true,
        },
    });

    if (!je) {
        throw new Error("JE not found");
    }

    // 2️⃣ Delete JE's OTPs
    await prisma.otp.deleteMany({
        where: { userId: jeId },
    });

    // 3️⃣ Delete JE's refresh tokens
    await prisma.refreshToken.deleteMany({
        where: { userId: jeId },
    });

    // 4️⃣ Delete the JE
    await prisma.user.delete({
        where: { id: jeId },
    });

    return { success: true, message: "JE deleted successfully" };
};
