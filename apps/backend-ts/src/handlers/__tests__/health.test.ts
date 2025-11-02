import { describe, it, expect } from "vitest";
import { handler } from "../health";

describe("health handler", () => {
  it("returns 200 and ok body", async () => {
    const res = await handler({} as any, {} as any, {} as any) as any;
    expect(res.statusCode).toBe(200);
    expect(typeof res.body).toBe("string");
    const parsed = JSON.parse(res.body);
    expect(parsed.ok).toBe(true);
    expect(parsed.service).toBe("stamper-backend");
  });
});
