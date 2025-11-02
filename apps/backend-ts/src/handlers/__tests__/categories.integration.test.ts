import { beforeEach, describe, expect, it } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { handler, __resetCategoryState } from "../categories";
import type { CategoryNode, CategoryTreeResponse } from "@stamper/types";

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
  requestId: "integration-test",
  routeKey: "GET /admin/categories",
  stage: "test",
  time: "",
  timeEpoch: 0
} as const;

describe("categories integration flow", () => {
  beforeEach(() => {
    __resetCategoryState();
  });

  it("creates a department, adds a project, and reassigns an existing project", async () => {
    const initialTree = await invokeHandler({ method: "GET", path: "/admin/categories" });
    expect(initialTree.categories).toHaveLength(3);
    const internalTools = findNode(initialTree.categories, "proj-internal-tools");
    expect(internalTools).not.toBeNull();
    expect(initialTree.totals).toEqual({ departments: 3, projects: 4, tasks: 5, inactive: 2 });

    const createDeptResponse = await sendRequest({
      method: "POST",
      path: "/admin/categories",
      body: {
        level: "department",
        name: "品質保証部",
        description: "品質向上のための活動を担当",
        isActive: true
      }
    });
    expect(createDeptResponse.statusCode).toBe(201);
    const createdDept = JSON.parse(createDeptResponse.body ?? "{}").category as CategoryNode;

    const createProjectResponse = await sendRequest({
      method: "POST",
      path: "/admin/categories",
      body: {
        level: "project",
        parentId: createdDept.id,
        name: "QA体制整備",
        description: "テストプロセスの改善",
        isActive: true
      }
    });
    expect(createProjectResponse.statusCode).toBe(201);

    const updateResponse = await sendRequest({
      method: "PUT",
      path: `/admin/categories/${internalTools!.id}`,
      categoryId: internalTools!.id,
      body: {
        name: internalTools!.name,
        description: internalTools!.description,
        order: 2,
        isActive: internalTools!.isActive,
        parentId: createdDept.id
      }
    });
    expect(updateResponse.statusCode).toBe(200);

    const finalTree = await invokeHandler({ method: "GET", path: "/admin/categories" });
    expect(finalTree.totals.departments).toBe(4);
    expect(finalTree.totals.projects).toBe(5);

    const qaDept = findNode(finalTree.categories, createdDept.id);
    expect(qaDept).not.toBeNull();
    expect(qaDept?.children.map((child) => child.name)).toEqual([
      "QA体制整備",
      internalTools!.name
    ]);

    const devDept = findNode(finalTree.categories, "dept-dev");
    expect(devDept?.children.map((child) => child.id)).not.toContain(internalTools!.id);
  });
});

type RequestArgs = {
  method: "GET" | "POST" | "PUT";
  path: string;
  body?: Record<string, unknown> | null;
  categoryId?: string;
};

async function invokeHandler(args: { method: "GET"; path: string }): Promise<CategoryTreeResponse> {
  const response = await sendRequest({ method: args.method, path: args.path });
  expect(response.statusCode).toBe(200);
  return JSON.parse(response.body ?? "{}") as CategoryTreeResponse;
}

async function sendRequest(args: RequestArgs) {
  const event = buildEvent({
    method: args.method,
    path: args.path,
    body: args.body ? JSON.stringify(args.body) : undefined,
    categoryId: args.categoryId
  });
  return handler(event);
}

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

function findNode(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const childHit = findNode(node.children, id);
    if (childHit) {
      return childHit;
    }
  }
  return null;
}
