import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { z } from "zod";
import type {
  CategoryCreateRequest,
  CategoryCreateResponse,
  CategoryLevel,
  CategoryNode,
  CategoryTotals,
  CategoryTreeResponse,
  CategoryUpdateRequest,
  CategoryUpdateResponse
} from "@stamper/types";
import { jsonResponse } from "../lib/http";

const childLevelMap: Record<CategoryLevel, CategoryLevel | null> = {
  department: "project",
  project: "task",
  task: null
};

const CategoryLevelSchema = z.enum(["department", "project", "task"]);

const CategoryCreateSchema = z.object({
  name: z.string().trim().optional(),
  description: z.string().trim().optional(),
  level: CategoryLevelSchema,
  parentId: z.union([z.string().min(1), z.null()]).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(1).optional()
}) satisfies z.Schema<CategoryCreateRequest>;

const CategoryUpdateSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  order: z.number().int().min(1),
  isActive: z.boolean(),
  parentId: z.union([z.string().min(1), z.null()])
}) satisfies z.Schema<CategoryUpdateRequest>;

const initialCategoryTree: CategoryNode[] = [
  {
    id: "dept-dev",
    name: "開発部",
    description: "プロダクト開発と技術支援を担当",
    level: "department",
    order: 1,
    isActive: true,
    parentId: null,
    children: [
      {
        id: "proj-stamper",
        name: "Stamper開発",
        description: "勤怠・経費一体型プロダクトの開発",
        level: "project",
        order: 1,
        isActive: true,
        parentId: "dept-dev",
        children: [
          {
            id: "task-ui-refresh",
            name: "UI刷新",
            description: "TailwindベースのUIへ刷新",
            level: "task",
            order: 1,
            isActive: true,
            parentId: "proj-stamper",
            children: []
          },
          {
            id: "task-ocr",
            name: "OCR改善",
            description: "領収書OCRの精度改善",
            level: "task",
            order: 2,
            isActive: true,
            parentId: "proj-stamper",
            children: []
          }
        ]
      },
      {
        id: "proj-internal-tools",
        name: "社内ツール整備",
        description: "社内向け開発支援ツールの整備",
        level: "project",
        order: 2,
        isActive: false,
        parentId: "dept-dev",
        children: [
          {
            id: "task-cli",
            name: "CLI改善",
            description: "CLIのDX改善タスク",
            level: "task",
            order: 1,
            isActive: false,
            parentId: "proj-internal-tools",
            children: []
          }
        ]
      }
    ]
  },
  {
    id: "dept-sales",
    name: "営業部",
    description: "法人営業と顧客サポートを担当",
    level: "department",
    order: 2,
    isActive: true,
    parentId: null,
    children: [
      {
        id: "proj-client-a",
        name: "クライアントA案件",
        description: "A社向け提案・導入支援",
        level: "project",
        order: 1,
        isActive: true,
        parentId: "dept-sales",
        children: [
          {
            id: "task-onboarding",
            name: "オンボーディング支援",
            description: "導入初期サポートとFAQ整備",
            level: "task",
            order: 1,
            isActive: true,
            parentId: "proj-client-a",
            children: []
          }
        ]
      }
    ]
  },
  {
    id: "dept-ops",
    name: "管理部",
    description: "人事・労務・経理業務を担当",
    level: "department",
    order: 3,
    isActive: true,
    parentId: null,
    children: [
      {
        id: "proj-attendance",
        name: "勤怠運用",
        description: "勤怠制度の運用と改善",
        level: "project",
        order: 1,
        isActive: true,
        parentId: "dept-ops",
        children: [
          {
            id: "task-audit",
            name: "打刻監査",
            description: "勤怠不備の確認と是正",
            level: "task",
            order: 1,
            isActive: true,
            parentId: "proj-attendance",
            children: []
          }
        ]
      }
    ]
  }
];

let categoryState: CategoryNode[] = sortAndNormalize(initialCategoryTree);

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const method = event.requestContext.http.method;
    const categoryId = event.pathParameters?.categoryId ?? null;

    if (method === "GET") {
      return jsonResponse(200, buildTreeResponse());
    }

    if (method === "POST") {
      const payload = parseBody(event.body);
      const parsed = CategoryCreateSchema.safeParse(payload);
      if (!parsed.success) {
        return jsonResponse(400, { error: parsed.error.message });
      }
      const result = createCategory(parsed.data);
      if (!result) {
        return jsonResponse(400, { error: "指定された親階層が存在しないか、レベルの組み合わせが不正です" });
      }
      categoryState = sortAndNormalize(result.nodes);
      const createdNode = findNodeById(categoryState, result.created.id) ?? result.created;
      return jsonResponse(201, buildCreateResponse(createdNode));
    }

    if (method === "PUT" && categoryId) {
      const payload = parseBody(event.body);
      const parsed = CategoryUpdateSchema.safeParse(payload);
      if (!parsed.success) {
        return jsonResponse(400, { error: parsed.error.message });
      }
      const result = updateCategory(categoryId, parsed.data);
      if (!result) {
        return jsonResponse(500, { error: "更新に失敗しました" });
      }
      if ("error" in result) {
        if (result.error === "NOT_FOUND") {
        return jsonResponse(404, { error: "指定された項目が見つかりません" });
        }
        return jsonResponse(400, { error: "親階層の指定が不正です" });
      }
      categoryState = sortAndNormalize(result.nodes);
      const updatedNode = findNodeById(categoryState, result.updated.id) ?? result.updated;
      return jsonResponse(200, buildUpdateResponse(updatedNode));
    }

    return jsonResponse(405, { error: "Method Not Allowed" });
  } catch (unknownError) {
    const message = unknownError instanceof Error ? unknownError.message : "internal error";
    return jsonResponse(500, { error: message });
  }
}

function parseBody(body: string | undefined | null): unknown {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function buildTreeResponse(): CategoryTreeResponse {
  return {
    categories: cloneTree(categoryState),
    totals: computeTotals(categoryState)
  };
}

function buildCreateResponse(created: CategoryNode): CategoryCreateResponse {
  return {
    category: created,
    categories: cloneTree(categoryState),
    totals: computeTotals(categoryState)
  };
}

function buildUpdateResponse(updated: CategoryNode): CategoryUpdateResponse {
  return {
    category: updated,
    categories: cloneTree(categoryState),
    totals: computeTotals(categoryState)
  };
}

function createCategory(payload: CategoryCreateRequest): { nodes: CategoryNode[]; created: CategoryNode } | null {
  const parentId = normalizeParentId(payload.level, payload.parentId);
  if (parentId instanceof Error) return null;

  const parentNode = parentId ? findNodeById(categoryState, parentId) : null;
  if (parentId && !parentNode) return null;

  const expectedLevel = parentNode ? childLevelMap[parentNode.level] : "department";
  if (expectedLevel !== payload.level) return null;

  const siblings = parentNode ? parentNode.children : categoryState;
  const defaultOrder = siblings.length + 1;
  const requestedOrder = payload.order ?? defaultOrder;
  const clampedOrder = clampOrder(requestedOrder, siblings.length + 1);

  const newNode: CategoryNode = {
    id: generateCategoryId(payload.level),
    name: payload.name && payload.name.trim().length > 0 ? payload.name.trim() : buildDefaultName(payload.level),
    description: payload.description?.trim() ?? "",
    level: payload.level,
    order: clampedOrder,
    isActive: payload.isActive ?? true,
    parentId,
    children: []
  };

  const insertion = insertNode(categoryState, parentId, newNode);
  if (!insertion.inserted) return null;
  return { nodes: insertion.nodes, created: newNode };
}

function updateCategory(
  categoryId: string,
  payload: CategoryUpdateRequest
): { nodes: CategoryNode[]; updated: CategoryNode } | { error: "NOT_FOUND" | "INVALID_PARENT" } | null {
  const existing = findNodeById(categoryState, categoryId);
  if (!existing) {
    return { error: "NOT_FOUND" };
  }

  const normalizedParentId = normalizeParentId(existing.level, payload.parentId);
  if (normalizedParentId instanceof Error) {
    return { error: "INVALID_PARENT" };
  }

  if (existing.level === "department" && normalizedParentId) {
    return { error: "INVALID_PARENT" };
  }

  if (normalizedParentId) {
    const parent = findNodeById(categoryState, normalizedParentId);
    if (!parent) {
      return { error: "INVALID_PARENT" };
    }
    const expectedLevel = childLevelMap[parent.level];
    if (expectedLevel !== existing.level) {
      return { error: "INVALID_PARENT" };
    }
  }

  const parentChanged = existing.parentId !== normalizedParentId;
  const targetOrder = clampOrder(payload.order, getSiblingCount(categoryState, normalizedParentId));

  if (parentChanged) {
    const removal = removeNodeById(categoryState, categoryId);
    if (!removal.removed) {
      return null;
    }
    const updatedNode: CategoryNode = {
      ...removal.removed,
      name: payload.name,
      description: payload.description?.trim() ?? "",
      order: targetOrder,
      isActive: payload.isActive,
      parentId: normalizedParentId,
      children: removal.removed.children
    };
    const insertion = insertNode(removal.nodes, normalizedParentId, updatedNode);
    if (!insertion.inserted) {
      return null;
    }
    return { nodes: insertion.nodes, updated: updatedNode };
  }

  const updateResult = updateNodeById(categoryState, categoryId, (node) => ({
    ...node,
    name: payload.name,
    description: payload.description?.trim() ?? "",
    order: targetOrder,
    isActive: payload.isActive,
    parentId: normalizedParentId
  }));

  if (!updateResult.updated) {
    return null;
  }

  const updatedNode = findNodeById(updateResult.nodes, categoryId);
  if (!updatedNode) {
    return null;
  }

  return { nodes: updateResult.nodes, updated: updatedNode };
}

function normalizeParentId(level: CategoryLevel, parentId: string | null | undefined): string | null | Error {
  if (level === "department") {
    return null;
  }
  if (parentId === undefined || parentId === null || parentId === "") {
    return new Error("parent required");
  }
  return parentId;
}

function clampOrder(requestedOrder: number, length: number): number {
  if (Number.isNaN(requestedOrder) || requestedOrder < 1) {
    return 1;
  }
  if (requestedOrder > length) {
    return length;
  }
  return requestedOrder;
}

function cloneTree(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.map((node) => ({
    ...node,
    children: cloneTree(node.children)
  }));
}

function computeTotals(nodes: CategoryNode[]): CategoryTotals {
  const flat = flatten(nodes);
  return {
    departments: flat.filter((node) => node.level === "department").length,
    projects: flat.filter((node) => node.level === "project").length,
    tasks: flat.filter((node) => node.level === "task").length,
    inactive: flat.filter((node) => !node.isActive).length
  };
}

function flatten(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

function findNodeById(nodes: CategoryNode[], targetId: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }
    if (node.children.length > 0) {
      const found = findNodeById(node.children, targetId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function getSiblingCount(nodes: CategoryNode[], parentId: string | null): number {
  if (parentId === null) {
    return nodes.length;
  }
  const parent = findNodeById(nodes, parentId);
  return parent ? parent.children.length : 0;
}

function insertNode(
  nodes: CategoryNode[],
  parentId: string | null,
  nodeToInsert: CategoryNode
): { nodes: CategoryNode[]; inserted: boolean } {
  if (parentId === null) {
    return {
      nodes: [...nodes, nodeToInsert],
      inserted: true
    };
  }

  let inserted = false;
  const nextNodes = nodes.map((node) => {
    if (node.id === parentId) {
      inserted = true;
      return {
        ...node,
        children: [...node.children, nodeToInsert]
      };
    }
    if (node.children.length > 0) {
      const childResult = insertNode(node.children, parentId, nodeToInsert);
      if (childResult.inserted) {
        inserted = true;
        return {
          ...node,
          children: childResult.nodes
        };
      }
    }
    return node;
  });

  return {
    nodes: inserted ? nextNodes : nodes,
    inserted
  };
}

function removeNodeById(
  nodes: CategoryNode[],
  id: string
): { nodes: CategoryNode[]; removed: CategoryNode | null } {
  let removed: CategoryNode | null = null;
  const nextNodes: CategoryNode[] = [];

  for (const node of nodes) {
    if (node.id === id) {
      removed = node;
      continue;
    }
    if (!removed && node.children.length > 0) {
      const childResult = removeNodeById(node.children, id);
      if (childResult.removed) {
        removed = childResult.removed;
        nextNodes.push({
          ...node,
          children: childResult.nodes
        });
        continue;
      }
    }
    nextNodes.push(node);
  }

  return {
    nodes: removed ? nextNodes : nodes,
    removed
  };
}

function updateNodeById(
  nodes: CategoryNode[],
  id: string,
  updater: (node: CategoryNode) => CategoryNode
): { nodes: CategoryNode[]; updated: boolean } {
  let updated = false;
  const nextNodes = nodes.map((node) => {
    if (node.id === id) {
      updated = true;
      return updater(node);
    }
    if (node.children.length > 0) {
      const childResult = updateNodeById(node.children, id, updater);
      if (childResult.updated) {
        updated = true;
        return {
          ...node,
          children: childResult.nodes
        };
      }
    }
    return node;
  });

  return {
    nodes: updated ? nextNodes : nodes,
    updated
  };
}

function sortAndNormalize(nodes: CategoryNode[]): CategoryNode[] {
  return nodes
    .map((node) => ({
      ...node,
      children: sortAndNormalize(node.children)
    }))
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name, "ja");
    })
    .map((node, index) => ({
      ...node,
      order: index + 1
    }));
}

function buildDefaultName(level: CategoryLevel): string {
  switch (level) {
    case "department":
      return "新しい部署";
    case "project":
      return "新しいプロジェクト";
    case "task":
      return "新しいタスク";
    default:
      return "新しい項目";
  }
}

function generateCategoryId(level: CategoryLevel): string {
  const prefix = level === "department" ? "dept" : level === "project" ? "proj" : "task";
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function __resetCategoryState(): void {
  categoryState = sortAndNormalize(initialCategoryTree);
}
