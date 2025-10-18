"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CheckboxField,
  SelectField,
  TextField
} from "../../../path_to_your_design_system/components";
import { getCurrentCognitoSession } from "../../../lib/cognitoClient";
import { mainNavItems, type MainNavItemId } from "../../navItems";

type CategoryLevel = "department" | "project" | "task";

type CategoryNode = {
  id: string;
  name: string;
  description: string;
  level: CategoryLevel;
  order: number;
  isActive: boolean;
  parentId: string | null;
  children: CategoryNode[];
};

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

const flattenTree = (nodes: CategoryNode[]): CategoryNode[] => {
  const list: CategoryNode[] = [];
  nodes.forEach((node) => {
    list.push(node);
    if (node.children.length > 0) {
      list.push(...flattenTree(node.children));
    }
  });
  return list;
};

const levelLabel: Record<CategoryLevel, string> = {
  department: "大分類（部署）",
  project: "中分類（プロジェクト）",
  task: "小分類（タスク）"
};

type FormDraft = {
  name: string;
  description: string;
  order: string;
  isActive: boolean;
  level: CategoryLevel;
  parentId: string | null;
};

const generateCategoryId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `category-${Math.random().toString(36).slice(2, 10)}`;

const sortTree = (nodes: CategoryNode[]): CategoryNode[] => {
  return [...nodes]
    .map((node) => ({
      ...node,
      children: sortTree(node.children)
    }))
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name, "ja");
    });
};

const updateNodeById = (
  nodes: CategoryNode[],
  id: string,
  updater: (node: CategoryNode) => CategoryNode
): { nodes: CategoryNode[]; updated: boolean } => {
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
};

const removeNodeById = (
  nodes: CategoryNode[],
  id: string
): { nodes: CategoryNode[]; removed: CategoryNode | null; changed: boolean } => {
  let removed: CategoryNode | null = null;
  let changed = false;
  const nextNodes: CategoryNode[] = [];

  nodes.forEach((node) => {
    if (node.id === id) {
      removed = node;
      changed = true;
      return;
    }

    if (removed) {
      nextNodes.push(node);
      return;
    }

    if (node.children.length > 0) {
      const childResult = removeNodeById(node.children, id);
      if (childResult.removed) {
        removed = childResult.removed;
        changed = true;
        nextNodes.push({
          ...node,
          children: childResult.nodes
        });
        return;
      }
    }

    nextNodes.push(node);
  });

  return {
    nodes: changed ? nextNodes : nodes,
    removed,
    changed
  };
};

const insertNode = (
  nodes: CategoryNode[],
  parentId: string | null,
  nodeToInsert: CategoryNode
): { nodes: CategoryNode[]; inserted: boolean } => {
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
};

const findNodeById = (nodes: CategoryNode[], id: string): CategoryNode | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children.length > 0) {
      const found = findNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

const getChildrenOfParent = (nodes: CategoryNode[], parentId: string | null): CategoryNode[] => {
  if (parentId === null) {
    return nodes;
  }
  const parentNode = findNodeById(nodes, parentId);
  return parentNode ? parentNode.children : [];
};

const collectDescendantIds = (node: CategoryNode | null): Set<string> => {
  const ids = new Set<string>();
  if (!node) {
    return ids;
  }
  const stack: CategoryNode[] = [...node.children];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    ids.add(current.id);
    if (current.children.length > 0) {
      stack.push(...current.children);
    }
  }
  return ids;
};

export default function TaskManagementPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeNav, setActiveNav] = useState<MainNavItemId | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>(initialCategoryTree);
  const [selectedId, setSelectedId] = useState<string>(initialCategoryTree[0]?.id ?? "");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(flattenTree(initialCategoryTree).map((node) => node.id))
  );
  const [formDraft, setFormDraft] = useState<FormDraft | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormDraft, string>>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showStatusMessage = useCallback((message: string, duration = 2500) => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    setStatusMessage(message);
    statusTimeoutRef.current = setTimeout(() => {
      setStatusMessage(null);
      statusTimeoutRef.current = null;
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const allNodes = useMemo(() => flattenTree(categories), [categories]);
  const selectedNode = useMemo(
    () => allNodes.find((node) => node.id === selectedId) ?? null,
    [allNodes, selectedId]
  );
  const descendantIds = useMemo(() => collectDescendantIds(selectedNode), [selectedNode]);

  useEffect(() => {
    let canceled = false;

    getCurrentCognitoSession()
      .then((session) => {
        if (canceled) return;
        if (!session) {
          router.replace("/");
          return;
        }
        setIsAuthorized(true);
      })
      .catch((error) => {
        console.warn("Failed to verify Cognito session on admin task management", error);
        router.replace("/");
      });

    return () => {
      canceled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!selectedNode) {
      setFormDraft(null);
      setFormErrors({});
      return;
    }
    setFormDraft({
      name: selectedNode.name,
      description: selectedNode.description,
      order: String(selectedNode.order),
      isActive: selectedNode.isActive,
      level: selectedNode.level,
      parentId: selectedNode.parentId
    });
    setFormErrors({});
  }, [selectedNode]);

  const totals = useMemo(() => {
    const departments = allNodes.filter((node) => node.level === "department").length;
    const projects = allNodes.filter((node) => node.level === "project").length;
    const tasks = allNodes.filter((node) => node.level === "task").length;
    const inactive = allNodes.filter((node) => !node.isActive).length;
    return { departments, projects, tasks, inactive };
  }, [allNodes]);

  const handleNavClick = useCallback(
    (item: (typeof mainNavItems)[number]) => {
      setActiveNav(item.id);
      router.push(item.href);
    },
    [router]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleFormChange = useCallback(<K extends keyof FormDraft>(key: K, value: FormDraft[K]) => {
    setFormDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setFormErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!formDraft || !selectedNode) {
      return;
    }

    const trimmedName = formDraft.name.trim();
    const parsedOrder = Number.parseInt(formDraft.order, 10);
    const parentRequired = formDraft.level !== "department";

    const errors: Partial<Record<keyof FormDraft, string>> = {};
    if (!trimmedName) {
      errors.name = "項目名を入力してください";
    }
    if (Number.isNaN(parsedOrder) || parsedOrder < 1) {
      errors.order = "1以上の整数を入力してください";
    }
    if (parentRequired && !formDraft.parentId) {
      errors.parentId = "親階層を選択してください";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showStatusMessage("入力内容を確認してください。", 3000);
      return;
    }

    const nextParentId = formDraft.level === "department" ? null : formDraft.parentId;
    const parentChanged = selectedNode.parentId !== nextParentId;
    let saveSucceeded = false;

    setCategories((prev) => {
      if (!selectedNode) {
        return prev;
      }

      if (parentChanged) {
        const removal = removeNodeById(prev, selectedNode.id);
        if (!removal.removed) {
          return prev;
        }
        const updatedNode: CategoryNode = {
          ...removal.removed,
          name: trimmedName,
          description: formDraft.description,
          order: parsedOrder,
          isActive: formDraft.isActive,
          parentId: nextParentId,
          children: removal.removed.children
        };
        const insertion = insertNode(removal.nodes, nextParentId, updatedNode);
        if (!insertion.inserted) {
          return prev;
        }
        saveSucceeded = true;
        return sortTree(insertion.nodes);
      }

      const updateResult = updateNodeById(prev, selectedNode.id, (node) => ({
        ...node,
        name: trimmedName,
        description: formDraft.description,
        order: parsedOrder,
        isActive: formDraft.isActive,
        parentId: node.level === "department" ? null : nextParentId
      }));

      if (!updateResult.updated) {
        saveSucceeded = true;
        return prev;
      }

      saveSucceeded = true;
      return sortTree(updateResult.nodes);
    });

    if (!saveSucceeded) {
      showStatusMessage("保存に失敗しました。再度お試しください。", 3000);
      return;
    }

    setFormDraft((prev) =>
      prev
        ? {
            ...prev,
            name: trimmedName,
            order: String(parsedOrder),
            parentId: nextParentId
          }
        : prev
    );
    setFormErrors({});
    showStatusMessage(`「${trimmedName}」を保存しました。`, 3000);

    if (parentChanged && nextParentId) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(nextParentId);
        return next;
      });
    }
  }, [formDraft, selectedNode, showStatusMessage]);

  const handleAddSibling = useCallback(() => {
    if (!selectedNode) {
      return;
    }

    let createdNode: CategoryNode | null = null;
    setCategories((prev) => {
      const siblings = getChildrenOfParent(prev, selectedNode.parentId);
      const nextOrder = siblings.reduce((max, node) => Math.max(max, node.order), 0) + 1;
      createdNode = {
        id: generateCategoryId(),
        name: `${levelLabel[selectedNode.level]}（新規）`,
        description: "",
        level: selectedNode.level,
        order: nextOrder,
        isActive: true,
        parentId: selectedNode.parentId,
        children: []
      };
      const insertion = insertNode(prev, selectedNode.parentId, createdNode);
      if (!insertion.inserted) {
        createdNode = null;
        return prev;
      }
      return sortTree(insertion.nodes);
    });

    if (!createdNode) {
      showStatusMessage("項目の追加に失敗しました。再度お試しください。", 3000);
      return;
    }

    setFormErrors({});
    setSelectedId(createdNode.id);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (createdNode?.parentId) {
        next.add(createdNode.parentId);
      }
      next.add(createdNode.id);
      return next;
    });
    showStatusMessage(`${levelLabel[selectedNode.level]}を追加しました。`);
  }, [selectedNode, showStatusMessage]);

  const handleAddChild = useCallback(() => {
    if (!selectedNode) {
      return;
    }

    const nextLevelMap: Record<CategoryLevel, CategoryLevel | null> = {
      department: "project",
      project: "task",
      task: null
    };
    const childLevel = nextLevelMap[selectedNode.level];
    if (!childLevel) {
      showStatusMessage("小分類より下の階層は追加できません。", 2500);
      return;
    }

    let createdNode: CategoryNode | null = null;
    setCategories((prev) => {
      const parentNode = findNodeById(prev, selectedNode.id);
      const children = parentNode ? parentNode.children : [];
      const nextOrder = children.reduce((max, node) => Math.max(max, node.order), 0) + 1;
      createdNode = {
        id: generateCategoryId(),
        name: `${levelLabel[childLevel]}（新規）`,
        description: "",
        level: childLevel,
        order: nextOrder,
        isActive: true,
        parentId: selectedNode.id,
        children: []
      };
      const insertion = insertNode(prev, selectedNode.id, createdNode);
      if (!insertion.inserted) {
        createdNode = null;
        return prev;
      }
      return sortTree(insertion.nodes);
    });

    if (!createdNode) {
      showStatusMessage("項目の追加に失敗しました。再度お試しください。", 3000);
      return;
    }

    setFormErrors({});
    setSelectedId(createdNode.id);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(selectedNode.id);
      next.add(createdNode.id);
      return next;
    });
    showStatusMessage(`${levelLabel[childLevel]}を追加しました。`);
  }, [selectedNode, showStatusMessage]);

  const handleReset = useCallback(() => {
    if (!selectedNode) {
      return;
    }
    setFormDraft({
      name: selectedNode.name,
      description: selectedNode.description,
      order: String(selectedNode.order),
      isActive: selectedNode.isActive,
      level: selectedNode.level,
      parentId: selectedNode.parentId
    });
    setFormErrors({});
    showStatusMessage("フォーム内容を元に戻しました。", 2000);
  }, [selectedNode, showStatusMessage]);

  const availableParentOptions = useMemo(() => {
    if (!selectedNode) {
      return [] as Array<{ value: string; label: string }>;
    }
    let candidates: CategoryNode[] = [];
    switch (selectedNode.level) {
      case "department":
        candidates = [];
        break;
      case "project":
        candidates = allNodes.filter((node) => node.level === "department");
        break;
      case "task":
        candidates = allNodes.filter((node) => node.level === "project");
        break;
    }
    const filtered = candidates.filter(
      (candidate) => candidate.id !== selectedNode.id && !descendantIds.has(candidate.id)
    );
    return filtered.map((candidate) => ({ value: candidate.id, label: `${candidate.name} (${levelLabel[candidate.level]})` }));
  }, [allNodes, descendantIds, selectedNode]);

  const renderTree = useCallback((nodes: CategoryNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedIds.has(node.id);
      const hasChildren = node.children.length > 0;
      const isSelected = node.id === selectedId;
      return (
        <li key={node.id} className="space-y-1">
          <div
            className={`flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-sm transition ${
              isSelected ? "bg-brand-primary/10 text-brand-primary" : "bg-transparent text-text-secondary hover:bg-surface-muted/70"
            }`}
          >
            <div className="flex flex-1 items-center gap-2">
              {hasChildren ? (
                <button
                  type="button"
                  className={`flex h-5 w-5 items-center justify-center rounded-sm border border-border-subtle text-xs transition ${
                    isExpanded ? "bg-brand-primary text-text-inverse" : "bg-surface-primary text-text-secondary"
                  }`}
                  onClick={() => toggleExpand(node.id)}
                  aria-label={isExpanded ? `${node.name} を折りたたむ` : `${node.name} を展開`}
                >
                  {isExpanded ? "-" : "+"}
                </button>
              ) : (
                <span className="h-5 w-5" aria-hidden />
              )}
              <button
                type="button"
                className="flex flex-1 items-center gap-2 text-left"
                onClick={() => setSelectedId(node.id)}
                aria-current={isSelected ? "true" : undefined}
              >
                <span className="font-semibold text-text-primary">{node.name}</span>
                <span className="text-xs text-text-tertiary">{levelLabel[node.level]}</span>
                {!node.isActive ? (
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-tertiary">
                    inactive
                  </span>
                ) : null}
              </button>
            </div>
            <span className="ml-3 text-xs text-text-tertiary">並び順: {node.order}</span>
          </div>
          {hasChildren && isExpanded ? (
            <ul className="ml-6 border-l border-border-subtle pl-4">
              {renderTree(node.children, depth + 1)}
            </ul>
          ) : null}
        </li>
      );
    });
  }, [expandedIds, selectedId, toggleExpand]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-12 md:px-12">
      <span className="self-start rounded-[var(--radius-xl)] border border-border-strong bg-surface-contrast px-3 py-1 text-sm font-medium text-brand-primary">
        TaskManagementPage
      </span>
      <main className="w-full max-w-6xl rounded-[var(--radius-xl)] bg-surface-shell p-10 shadow-elevated">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">管理者</p>
            <h1 className="text-2xl font-bold text-text-primary">作業項目管理</h1>
            <p className="text-sm text-text-secondary">
              作業項目の階層構造を管理し、各分類の有効・無効や表示順を調整します。ドラッグ＆ドロップによる入れ替えは今後実装予定です。
            </p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="メインメニュー">
            {mainNavItems.map((item) => {
              const isActive = item.id === activeNav;
              return (
                <Button
                  key={item.id}
                  className={`min-h-0 gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-semibold ${
                    isActive ? "shadow-ambient" : ""
                  }`}
                  type="button"
                  variant={isActive ? "primary" : "secondary"}
                  onClick={() => handleNavClick(item)}
                  aria-pressed={isActive}
                >
                  <span
                    className="h-4 w-4 rounded-[var(--radius-sm)] bg-gradient-to-tr from-brand-primary to-brand-primary-dark shadow-inner"
                    aria-hidden
                  />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </header>

        {statusMessage ? (
          <div
            className="mt-8 rounded-[var(--radius-md)] border border-brand-secondary/40 bg-brand-secondary/10 px-4 py-3 text-sm text-brand-secondary"
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </div>
        ) : null}

        <section className="mt-10 grid gap-4 md:grid-cols-4" aria-label="項目サマリー">
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">大分類（部署）</p>
            <p className="text-2xl font-bold text-text-primary">{totals.departments}</p>
          </Card>
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">中分類（プロジェクト）</p>
            <p className="text-2xl font-bold text-text-primary">{totals.projects}</p>
          </Card>
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">小分類（タスク）</p>
            <p className="text-2xl font-bold text-text-primary">{totals.tasks}</p>
          </Card>
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">無効項目</p>
            <p className="text-2xl font-bold text-text-primary">{totals.inactive}</p>
          </Card>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.9fr,1.1fr]" aria-labelledby="tree-heading">
          <Card spacing="section" className="gap-6" role="region" aria-labelledby="tree-heading">
            <header className="flex items-center justify-between">
              <div>
                <h2 id="tree-heading" className="text-xl font-semibold text-text-primary">
                  作業項目階層
                </h2>
                <p className="text-sm text-text-secondary">各分類を選択すると詳細が右側に表示されます。</p>
              </div>
              <span className="text-xs text-text-tertiary">クリックで選択 / プラスで展開</span>
            </header>
            <ul className="space-y-2" aria-label="作業項目ツリー">
              {renderTree(categories)}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={handleAddSibling}>
                同階層に追加
              </Button>
              <Button type="button" variant="secondary" onClick={handleAddChild}>
                下位階層に追加
              </Button>
            </div>
          </Card>

          <Card spacing="section" className="gap-6" role="region" aria-labelledby="editor-heading">
            <header className="space-y-1">
              <h2 id="editor-heading" className="text-xl font-semibold text-text-primary">
                項目編集
              </h2>
              <p className="text-sm text-text-secondary">
                選択中の項目名称、説明、表示順、有効フラグを編集できます。保存すると監査ログに記録されます。
              </p>
            </header>
            {selectedNode && formDraft ? (
              <form className="space-y-6" onSubmit={(event) => event.preventDefault()} noValidate>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    id="category-name"
                    label="項目名"
                    value={formDraft.name}
                    onChange={(event) => handleFormChange("name", event.target.value)}
                    errorText={formErrors.name}
                  />
                  <TextField
                    id="category-order"
                    label="表示順"
                    type="number"
                    min="1"
                    value={formDraft.order}
                    onChange={(event) => handleFormChange("order", event.target.value)}
                    errorText={formErrors.order}
                  />
                  <TextField
                    id="category-description"
                    label="説明"
                    value={formDraft.description}
                    onChange={(event) => handleFormChange("description", event.target.value)}
                    className="md:col-span-2"
                  />
                  <SelectField
                    id="category-parent"
                    label="親階層"
                    value={formDraft.parentId ?? ""}
                    onChange={(event) => handleFormChange("parentId", event.target.value ? event.target.value : null)}
                    options={
                      selectedNode?.level === "department"
                        ? [{ value: "", label: "最上位（部署）" }]
                        : availableParentOptions.length > 0
                          ? [{ value: "", label: "親階層を選択" }, ...availableParentOptions]
                          : [{ value: "", label: "選択可能な親階層がありません" }]
                    }
                    disabled={selectedNode?.level === "department"}
                    className="md:col-span-2"
                    errorText={formErrors.parentId}
                  />
                </div>
                <CheckboxField
                  id="category-active"
                  label="有効化"
                  supportingText="無効化すると入力画面の候補から除外されます"
                  checked={formDraft.isActive}
                  onChange={(event) => handleFormChange("isActive", event.target.checked)}
                />
                <div className="flex flex-wrap gap-3 md:justify-end">
                  <Button type="button" variant="secondary" onClick={handleReset}>
                    取り消し
                  </Button>
                  <Button type="button" variant="primary" onClick={handleSave}>
                    保存する
                  </Button>
                </div>
              </form>
            ) : (
              <p className="rounded-[var(--radius-md)] bg-surface-muted px-4 py-3 text-sm text-text-secondary">
                編集する項目を左のツリーから選択してください。
              </p>
            )}
          </Card>
        </section>

        <section className="mt-10" aria-labelledby="audit-heading">
          <Card spacing="section" className="gap-6">
            <header className="flex items-center justify-between">
              <div>
                <h2 id="audit-heading" className="text-xl font-semibold text-text-primary">
                  変更履歴（ダミーデータ）
                </h2>
                <p className="text-sm text-text-secondary">近日、検索とフィルタリング機能を追加予定です。</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  showStatusMessage("変更履歴のエクスポートは現在準備中です。", 2500);
                }}
              >
                履歴をエクスポート
              </Button>
            </header>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="rounded-[var(--radius-md)] bg-surface-primary/70 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">宮里 康介</span>
                  <span className="text-xs text-text-tertiary">2025/09/15 21:40</span>
                </div>
                <p className="mt-1">「UI刷新」を有効に変更し、並び順を 1 に更新</p>
              </li>
              <li className="rounded-[var(--radius-md)] bg-surface-primary/70 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">田中 一郎</span>
                  <span className="text-xs text-text-tertiary">2025/09/10 10:12</span>
                </div>
                <p className="mt-1">「社内ツール整備」を無効に変更</p>
              </li>
              <li className="rounded-[var(--radius-md)] bg-surface-primary/70 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">高橋 美咲</span>
                  <span className="text-xs text-text-tertiary">2025/09/05 18:05</span>
                </div>
                <p className="mt-1">新規タスク「オンボーディング支援」を追加</p>
              </li>
            </ul>
          </Card>
        </section>
      </main>
    </div>
  );
}
