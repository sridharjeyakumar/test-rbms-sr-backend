import prisma from "../prisma/index.js";
import { hashPassword } from "../utils/password.utils.js";

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
    adminId: user.adminId,
});
export const getAllUsers = async (trafficControllerId) => {
    try {
        // Get all users with role "SM" under the trafficControllerId
        const smUsers = await prisma.user.findMany({
            where: {
                adminId: trafficControllerId,
                role: "SM",
            },
        });

        // Filter out users with depot === 'OVERALL'
        const filteredUsers = smUsers.filter((u) => u.depot !== "OVERALL");

        // Sort by creation date (newest first)
        filteredUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return filteredUsers.map(formatUserData);
    } catch (error) {
        console.error("Error fetching SM users:", error);
        throw error;
    }
};
export const updateUser = async (userId, updateData) => {
    // Check if the user exists
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            role: "SM",
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
// export const deleteUser = async (userId) => {
//     // Check if the user exists and has role SM
//     const user = await prisma.user.findFirst({
//         where: {
//             id: userId,
//             role: "SM",
//         },
//     });

//     if (!user) {
//         throw new Error("Station Master not found");
//     }

//     // Delete the Station Master
//     await prisma.user.delete({
//         where: {
//             id: userId,
//         },
//     });

//     return { success: true, message: "Station Master deleted successfully" };
// };

export const deleteUser = async (userId) => {
    // 1️⃣ Check if SM exists
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            role: "SM",
        },
    });

    if (!user) {
        throw new Error("Station Master not found");
    }

    // 2️⃣ Delete SM OTPs
    await prisma.otp.deleteMany({
        where: {
            userId: userId,
        },
    });

    // 3️⃣ Delete SM Refresh Tokens
    await prisma.refreshToken.deleteMany({
        where: {
            userId: userId,
        },
    });

    // 4️⃣ Delete the SM
    await prisma.user.delete({
        where: {
            id: userId,
        },
    });

    return { success: true, message: "Station Master deleted successfully" };
};

export const createUser = async (userData, location, adminId) => {
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

    // Create the new USER
    const newUser = await prisma.user.create({
        data: {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            depot: userData.depot,
            role: "SM",
            location: location,
            password: hashedPassword,
            department: userData.department || null,
            adminId: adminId,
        },
    });

    return formatUserData(newUser);
};
