import prisma from "../../src/prisma/index.js"; // adjust path
import { addDays, format } from "date-fns";

export default async function handler(req, res) {
    try {
        const now = new Date();

        // Calculate expiry = sanctionedTimeTo + 8 hours
        // Actually we check: sanctionedTimeTo + 8 hours <= now
        // In Prisma, we can do it by calculating expiryTime in JS
        // For batch, we can compare: sanctionedTimeTo <= now - 8 hours
        const expiryThreshold = new Date(now.getTime() - 8 * 60 * 60 * 1000);

        // Date range filter: today → 10 days ahead
        const today = now;

        const endDate = addDays(today, 10);
        const formattedStartDate = format(today, "yyyy-MM-dd");
        const formattedEndDate = format(endDate, "yyyy-MM-dd");
        // Find eligible requests
        const requests = await prisma.request.findMany({
            where: {
                isSanctioned: true,
                sanctionedTimeTo: { lte: expiryThreshold }, // sanction expired + 8h
                date: {
                    gte: new Date(formattedStartDate),
                    lte: new Date(formattedEndDate),
                }, // within date range
                OR: [
                    { userAcceptanceForSanction: true, AppliedTimeFrom: null },
                    { userAcceptanceForSanction: false, AppliedTimeFrom: null, userResponse: null },
                ],
            },
            select: { id: true, sanctionedTimeTo: true, date: true }, // for logging/debug
        });

        if (requests.length === 0) {
            return res.status(200).json({ ok: true, message: "No requests to auto-reject" });
        }

        // Bulk update
        const idsToUpdate = requests.map((r) => r.id);

        const updated = await prisma.request.updateMany({
            where: { id: { in: idsToUpdate } },
            data: {
                status: "AUTO_REJECTED",
                userResponse: "SSE not responed,so it is auto-rejected",
                userAcceptanceForSanction: false,
            },
        });

        return res.status(200).json({
            ok: true,
            message: `${updated.count} requests auto-rejected`,
            requests: requests.map((r) => ({
                id: r.id,
                sanctionedTimeTo: r.sanctionedTimeTo,
                date: r.date,
            })),
        });
    } catch (err) {
        console.error("Cron Error:", err);
        return res.status(500).json({ error: "Server Error" });
    }
}
