import { prisma } from "../lib/prisma";

export interface ApiLogInput {
  transactionId?: string;
  refId?: string;
  service: string;
  action: string;
  type?: 'outgoing' | 'incoming';
  method?: string;
  url?: string;
  requestPayload?: any;
  responsePayload?: any;
  status?: string;
  statusCode?: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Logs an API interaction (request, response, callback, etc.) to the database.
 * Designed to be non-blocking - errors are caught and logged to console.
 */
export async function logApiInteraction(data: ApiLogInput) {
  try {
    await prisma.apiInteractionLog.create({
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
  } catch (error) {
    console.error("[ApiInteractionLog] Failed to create log entry:", error);
  }
}
