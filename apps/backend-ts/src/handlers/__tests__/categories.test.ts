import { describe, expect, it, beforeEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { handler, __resetCategoryState } from "../categories";
import type { CategoryNode } from "@stamper/types";

const baseContext = {
  accountId: "test",
  apiId: "test",
  domainName: "example.com",
  domainPrefix: "example",
  http: {
    method: "GET",
    path: "/admin/categories",
    protocol: "HTTP/1.1",
    sourceIp: "127.0.0.1",
    userAgent: "vitest"
  },
  requestId: "test",
  routeKey: "GET /admin/categories",
  stage: "test",
  time: "",
  timeEpoch: 0
} as const;

describe("categories handler", () => {
  beforeEach(() => {
    __resetCategoryState();
  });

  it("returns the current category tree", async () => {
    const event = buildEvent({ method: "GET", path: "/admin/categories" });
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body ?? "{}");
    expect(body.categories).toHaveLength(3);
    expect(body.totals).toEqual({ departments: 3, projects: 4, tasks: 5, inactive: 2 });
  });

  it("creates a new project under a department", async () => {
    const payload = {
      level: "project",
      parentId: "dept-dev",
      name: "新規プロジェクト",
      description: "PoC向け",
      isActive: true
    };
    const event = buildEvent({ method: "POST", path: "/admin/categories", body: JSON.stringify(payload) });
    const response = await handler(event);
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body ?? "{}");
    expect(body.category.parentId).toBe("dept-dev");
  expect(body.totals.projects).toBe(5);
  const devDepartment = (body.categories as CategoryNode[]).find((node) => node.id === "dept-dev");
  expect(devDepartment?.children.some((child: CategoryNode) => child.name === "新規プロジェクト")).toBe(true);
  });

  it("moves a project to another department", async () => {
    const payload = {
      name: "クライアントA案件",
      description: "A社向け提案・導入支援",
      order: 2,
      isActive: true,
      parentId: "dept-dev"
    };
    const event = buildEvent({
      method: "PUT",
      path: "/admin/categories/proj-client-a",
      body: JSON.stringify(payload),
      categoryId: "proj-client-a"
    });
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
  const body = JSON.parse(response.body ?? "{}");
  const categories = body.categories as CategoryNode[];
  const devDepartment = categories.find((node) => node.id === "dept-dev");
  expect(devDepartment?.children.map((child: CategoryNode) => child.id)).toContain("proj-client-a");
  const salesDepartment = categories.find((node) => node.id === "dept-sales");
  expect(salesDepartment?.children.map((child: CategoryNode) => child.id)).not.toContain("proj-client-a");
  });
});

type BuildEventArgs = {
  method: "GET" | "POST" | "PUT";
  path: string;
  body?: string;
  categoryId?: string;
};

function buildEvent(args: BuildEventArgs): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: `${args.method} ${args.path}`,
    rawPath: args.path,
    rawQueryString: "",
    headers: {},
    requestContext: {
      ...baseContext,
      http: {
        ...baseContext.http,
        method: args.method,
        path: args.path
      },
      routeKey: `${args.method} ${args.path}`
    },
    isBase64Encoded: false,
    body: args.body,
    pathParameters: args.categoryId ? { categoryId: args.categoryId } : undefined
  } as APIGatewayProxyEventV2;
}
