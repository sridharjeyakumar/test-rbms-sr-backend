import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the root directory (two levels up from utils)
const rootDir = path.resolve(__dirname, "../../");

// Service account path
const serviceAccountPath = path.join(rootDir, "serviceAccountKey.json");

// Initialize Firebase Admin with the service account
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
    });
    console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
}

/**
 * Send a notification to a specific FCM token
 * @param {string} token - The FCM token to send the notification to
 * @param {object} notification - Notification object with title and body
 * @param {object} data - Additional data to send with the notification
 * @returns {Promise} - The message ID if successful
 */
export const sendNotificationToToken = async (token, notification, data = {}) => {
    try {
        const message = {
            token,
            notification,
            data: data,
            android: {
                priority: "high",
            },
        };

        const response = await admin.messaging().send(message);
        console.log("Successfully sent message:", response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error };
    }
};

/**
 * Send a notification to multiple FCM tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {object} notification - Notification object with title and body
 * @param {object} data - Additional data to send with the notification
 * @returns {Promise} - Array of message IDs if successful
 */
export const sendNotificationToMultipleTokens = async (tokens, notification, data = {}) => {
    if (!tokens || tokens.length === 0) {
        console.log("No tokens provided for notifications");
        return { success: false, error: "No tokens provided" };
    }

    // Filter out any null, undefined, or empty tokens
    const validTokens = tokens.filter((token) => token);

    if (validTokens.length === 0) {
        console.log("No valid tokens available for notifications");
        return { success: false, error: "No valid tokens available" };
    }

    try {
        const messages = validTokens.map((token) => ({
            token,
            notification,
            data,
            android: {
                priority: "high",
            },
        }));

        const response = await admin.messaging().sendEach(messages);
        console.log("Successfully sent batch messages:", response);
        return { success: true, response };
    } catch (error) {
        console.error("Error sending batch messages:", error);
        return { success: false, error };
    }
};

export default admin;
