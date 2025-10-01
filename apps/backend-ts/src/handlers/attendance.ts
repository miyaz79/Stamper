import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { z } from "zod";
import type { AttendanceSaveRequest, AttendanceSaveResponse } from "@stamper/types";

const AttendanceSaveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  workItems: z.array(
    z.object({
      departmentId: z.string().uuid(),
      projectId: z.string().uuid(),
      taskId: z.string().uuid(),
      hours: z.number().multipleOf(0.25).min(0).max(24)
    })
  ),
  leave: z
    .object({
      leaveType: z.enum(["full", "hourly"]),
      hours: z.number().multipleOf(0.25).min(0).max(7.5).optional()
    })
    .optional()
}) satisfies z.Schema<AttendanceSaveRequest>;

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    if (event.requestContext.http.method === "GET") {
      const date = event.queryStringParameters?.date;
      if (!date) return badRequest("date is required");
      return ok({ id: "dummy-id", calcResults: dummyCalc() });
    }
    if (event.requestContext.http.method === "PUT") {
      const body = event.body ? JSON.parse(event.body) : {};
      const parsed = AttendanceSaveSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error.message);
      // TODO: DB upsert via Kysely (post-PoC setup)
      return ok({ id: cryptoRandomId(), calcResults: dummyCalc() });
    }
    return methodNotAllowed();
  } catch (e: any) {
    return error(e?.message || "internal error");
  }
}

function ok(body: AttendanceSaveResponse): APIGatewayProxyStructuredResultV2 {
  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}
function badRequest(msg: string): APIGatewayProxyStructuredResultV2 {
  return { statusCode: 400, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: msg }) };
}
function methodNotAllowed(): APIGatewayProxyStructuredResultV2 {
  return { statusCode: 405, headers: { Allow: "GET, PUT" }, body: "" };
}
function error(msg: string): APIGatewayProxyStructuredResultV2 {
  return { statusCode: 500, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: msg }) };
}
function cryptoRandomId() {
  return `att_${Math.random().toString(36).slice(2, 10)}`;
}
function dummyCalc() {
  return {
    totalHours: 7.5,
    startTime: "09:30",
    endTime: "18:00",
    breakMinutes: 60,
    overtimeHours: 0.0,
    lateNightOvertimeHours: 0.0
  };
}
