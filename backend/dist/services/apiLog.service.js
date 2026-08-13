"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logApiInteraction = logApiInteraction;
const prisma_1 = require("../lib/prisma");
/**
 * Logs an API interaction (request, response, callback, etc.) to the database.
 * Designed to be non-blocking - errors are caught and logged to console.
 */
async function logApiInteraction(data) {
    try {
        await prisma_1.prisma.apiInteractionLog.create({
            data: {
                transactionId: data.transactionId,
                refId: data.refId,
                service: data.service,
                action: data.action,
                type: data.type || 'outgoing',
                method: data.method,
                url: data.url,
                requestPayload: data.requestPayload || undefined,
                responsePayload: data.responsePayload || undefined,
                status: data.status,
                statusCode: data.statusCode,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    }
    catch (error) {
        console.error("[ApiInteractionLog] Failed to create log entry:", error);
    }
}
