"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, SelectField, TextField } from "../../../path_to_your_design_system/components";
import { getCurrentCognitoSession } from "../../../lib/cognitoClient";
import { mainNavItems, type MainNavItemId } from "../../navItems";

type ExpenseStatus = "draft" | "submitted" | "approved" | "returned";

type ExpenseLine = {
  id: string;
  category: string;
  description: string;
  amount: number;
  taxCategory: "課税" | "軽減税率" | "非課税";
};

type ExpenseReceipt = {
  id: string;
  fileName: string;
  uploadedAt: string;
  type: "image" | "pdf";
};

type ExpenseHistory = {
  id: string;
  actor: string;
  action: "下書き保存" | "申請" | "承認" | "差戻し";
  timestamp: string;
  note?: string;
};

type ExpenseApplication = {
  id: string;
  appliedAt: string;
  title: string;
  applicant: string;
  referenceNumber: string;
  totalAmount: number;
  status: ExpenseStatus;
  receiptCount: number;
  lines: ExpenseLine[];
  receipts: ExpenseReceipt[];
  history: ExpenseHistory[];
};

const monthOptions = [
  { value: "2025-09", label: "2025年9月" },
  { value: "2025-08", label: "2025年8月" },
  { value: "2025-07", label: "2025年7月" }
];

type StatusOptionValue = "all" | ExpenseStatus;

const statusOptions: Array<{ value: StatusOptionValue; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "draft", label: "下書き" },
  { value: "submitted", label: "申請中" },
  { value: "approved", label: "承認済" },
  { value: "returned", label: "差戻し" }
];

const expenseApplications: ExpenseApplication[] = [
  {
    id: "exp-202509-001",
    appliedAt: "2025-09-12",
    title: "2025年9月 国内出張費",
    applicant: "宮里 康介",
    referenceNumber: "EXP-202509-001",
    totalAmount: 45800,
    status: "submitted",
    receiptCount: 3,
    lines: [
      {
        id: "line-01",
        category: "交通費",
        description: "那覇⇔東京 往復航空券",
        amount: 32800,
        taxCategory: "課税"
      },
      {
        id: "line-02",
        category: "宿泊費",
        description: "ホテル1泊",
        amount: 12000,
        taxCategory: "課税"
      },
      {
        id: "line-03",
        category: "雑費",
        description: "空港リムジンバス",
        amount: 1000,
        taxCategory: "非課税"
      }
    ],
    receipts: [
      { id: "rcpt-01", fileName: "boarding-pass.pdf", uploadedAt: "2025-09-12", type: "pdf" },
      { id: "rcpt-02", fileName: "hotel-tax-invoice.jpg", uploadedAt: "2025-09-12", type: "image" },
      { id: "rcpt-03", fileName: "limousine-ticket.png", uploadedAt: "2025-09-12", type: "image" }
    ],
    history: [
      { id: "hist-01", actor: "宮里 康介", action: "申請", timestamp: "2025-09-12 18:24" },
      { id: "hist-02", actor: "鈴木 花子", action: "承認", timestamp: "2025-09-13 09:05" }
    ]
  },
  {
    id: "exp-202509-004",
    appliedAt: "2025-09-15",
    title: "Stamper プロジェクト 打合せ費",
    applicant: "宮里 康介",
    referenceNumber: "EXP-202509-004",
    totalAmount: 9200,
    status: "returned",
    receiptCount: 2,
    lines: [
      {
        id: "line-04",
        category: "会議費",
        description: "クライアントA様とのランチミーティング",
        amount: 6800,
        taxCategory: "課税"
      },
      {
        id: "line-05",
        category: "交通費",
        description: "地下鉄往復",
        amount: 2400,
        taxCategory: "非課税"
      }
    ],
    receipts: [
      { id: "rcpt-04", fileName: "restaurant-receipt.jpg", uploadedAt: "2025-09-15", type: "image" },
      { id: "rcpt-05", fileName: "metro-ticket.pdf", uploadedAt: "2025-09-15", type: "pdf" }
    ],
    history: [
      { id: "hist-03", actor: "宮里 康介", action: "申請", timestamp: "2025-09-15 21:40" },
      {
        id: "hist-04",
        actor: "田中 一郎",
        action: "差戻し",
        timestamp: "2025-09-16 10:12",
        note: "領収書の日付が申請日と異なります。確認してください。"
      }
    ]
  },
  {
    id: "exp-202508-008",
    appliedAt: "2025-08-28",
    title: "8月分 SaaS 利用料",
    applicant: "宮里 康介",
    referenceNumber: "EXP-202508-008",
    totalAmount: 15400,
    status: "approved",
    receiptCount: 1,
    lines: [
      {
        id: "line-06",
        category: "ソフトウェア",
        description: "デザインコラボレーションツール 月額",
        amount: 15400,
        taxCategory: "課税"
      }
    ],
    receipts: [
      { id: "rcpt-06", fileName: "saas-invoice.pdf", uploadedAt: "2025-08-28", type: "pdf" }
    ],
    history: [
      { id: "hist-05", actor: "宮里 康介", action: "申請", timestamp: "2025-08-28 17:58" },
      { id: "hist-06", actor: "田中 一郎", action: "承認", timestamp: "2025-08-29 09:15" }
    ]
  },
  {
    id: "exp-202507-002",
    appliedAt: "2025-07-05",
    title: "7月期 オンライン勉強会 参加費",
    applicant: "宮里 康介",
    referenceNumber: "EXP-202507-002",
    totalAmount: 5500,
    status: "draft",
    receiptCount: 1,
    lines: [
      {
        id: "line-07",
        category: "教育研修",
        description: "React 最新動向ウェビナー",
        amount: 5500,
        taxCategory: "課税"
      }
    ],
    receipts: [
      { id: "rcpt-07", fileName: "webinar-ticket.png", uploadedAt: "2025-07-05", type: "image" }
    ],
    history: [
      { id: "hist-07", actor: "宮里 康介", action: "下書き保存", timestamp: "2025-07-05 13:47" }
    ]
  }
];

const statusLabel: Record<ExpenseStatus, string> = {
  draft: "下書き",
  submitted: "申請中",
  approved: "承認済",
  returned: "差戻し"
};

const statusClass: Record<ExpenseStatus, string> = {
  draft: "border-border-subtle bg-surface-muted text-text-secondary",
  submitted: "border-brand-primary/40 bg-brand-primary/10 text-brand-primary",
  approved: "border-brand-secondary/40 bg-brand-secondary/10 text-brand-secondary",
  returned: "border-accent-critical/40 bg-accent-critical/10 text-accent-critical"
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(amount);

const formatDate = (value: string) => {
  const instance = new Date(value);
  const month = String(instance.getMonth() + 1).padStart(2, "0");
  const day = String(instance.getDate()).padStart(2, "0");
  return `${month}/${day}`;
};

export default function ExpenseListPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeNav, setActiveNav] = useState<MainNavItemId>("expenses");
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value ?? "2025-09");
  const [selectedStatus, setSelectedStatus] = useState<StatusOptionValue>("all");
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

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
        console.warn("Failed to verify Cognito session on expense list", error);
        router.replace("/");
      });

    return () => {
      canceled = true;
    };
  }, [router]);

  const filteredExpenses = useMemo(() => {
    return expenseApplications.filter((application) => {
      const matchesMonth = selectedMonth ? application.appliedAt.startsWith(selectedMonth) : true;
      const matchesStatus = selectedStatus === "all" ? true : application.status === selectedStatus;
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchesKeyword = normalizedKeyword
        ? application.title.toLowerCase().includes(normalizedKeyword) ||
          application.referenceNumber.toLowerCase().includes(normalizedKeyword)
        : true;
      return matchesMonth && matchesStatus && matchesKeyword;
    });
  }, [keyword, selectedMonth, selectedStatus]);

  useEffect(() => {
    if (filteredExpenses.length === 0) {
      setSelectedExpenseId(null);
      return;
    }
    setSelectedExpenseId((prev) => {
      if (!prev) {
        return filteredExpenses[0]?.id ?? null;
      }
      const stillExists = filteredExpenses.some((application) => application.id === prev);
      return stillExists ? prev : filteredExpenses[0]?.id ?? null;
    });
  }, [filteredExpenses]);

  const selectedExpense = useMemo(
    () => filteredExpenses.find((application) => application.id === selectedExpenseId) ?? null,
    [filteredExpenses, selectedExpenseId]
  );

  const handleNavClick = useCallback(
    (item: (typeof mainNavItems)[number]) => {
      setActiveNav(item.id);
      router.push(item.href);
    },
    [router]
  );

  const handleRowClick = useCallback((id: string) => {
    setSelectedExpenseId(id);
  }, []);

  const handleAction = useCallback((kind: string, application: ExpenseApplication) => {
    setMessage(`${statusLabel[application.status]}ステータスの「${application.title}」に対する${kind}処理は現在準備中です。`);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-12 md:px-12">
      <span className="self-start rounded-[var(--radius-xl)] border border-border-strong bg-surface-contrast px-3 py-1 text-sm font-medium text-brand-primary">
        ExpenseListPage
      </span>
      <main className="w-full max-w-6xl rounded-[var(--radius-xl)] bg-surface-shell p-10 shadow-elevated">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">経費一覧</p>
            <h1 className="text-2xl font-bold text-text-primary">申請済み経費の一覧</h1>
            <p className="text-sm text-text-secondary">
              期間やステータスで絞り込み、経費申請の詳細と承認履歴を確認できます。申請ボタンからは引き続き経費申請画面に遷移できます。
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

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={() => router.push("/expenses")}
            className="min-h-0 px-4 py-2 text-sm">
            経費申請に戻る
          </Button>
        </div>

        {message ? (
          <div
            className="mt-8 rounded-[var(--radius-md)] border border-brand-secondary/40 bg-brand-secondary/10 px-4 py-3 text-sm text-brand-secondary"
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        ) : null}

        <section className="mt-10 flex flex-col gap-6" aria-labelledby="filters-heading">
          <div className="flex flex-wrap items-end gap-4" role="group" aria-labelledby="filters-heading">
            <div className="space-y-2">
              <h2 id="filters-heading" className="text-xl font-semibold text-text-primary">
                フィルター
              </h2>
              <p className="text-sm text-text-secondary">
                月度とステータスで絞り込みできます。検索欄からはタイトルや申請番号で検索可能です。
              </p>
            </div>
            <div className="flex flex-1 flex-wrap gap-4 md:justify-end">
              <SelectField
                id="filter-month"
                label="対象月"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                options={monthOptions}
                className="min-w-[200px]"
              />
              <SelectField
                id="filter-status"
                label="ステータス"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as StatusOptionValue)}
                options={statusOptions}
                className="min-w-[200px]"
              />
              <TextField
                id="filter-keyword"
                label="検索"
                placeholder="タイトルや申請番号"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="min-w-[240px]"
              />
            </div>
          </div>

          <Card spacing="section" className="gap-6" role="region" aria-labelledby="expense-table-heading">
            <div className="flex items-center justify-between gap-4">
              <h3 id="expense-table-heading" className="text-lg font-semibold text-text-primary">
                経費申請一覧
              </h3>
              <p className="text-xs text-text-tertiary">結果は最大20件ずつ表示され、今後無限スクロールを導入予定です。</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[880px] border-separate border-spacing-0 text-left text-sm text-text-secondary">
                <thead className="bg-surface-muted/60 text-xs uppercase tracking-wide text-text-tertiary">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-text-secondary">申請日</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">申請タイトル</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">合計金額</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">ステータス</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">明細数</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-text-secondary">
                        条件に一致する経費申請がありません。
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((application) => {
                      const isSelected = application.id === selectedExpenseId;
                      return (
                        <tr
                          key={application.id}
                          className={`border-b border-border-subtle transition hover:bg-surface-muted/60 ${
                            isSelected ? "bg-surface-muted/40" : ""
                          }`}
                          onClick={() => handleRowClick(application.id)}
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-text-primary">
                            {formatDate(application.appliedAt)}
                          </td>
                          <td className="max-w-[260px] truncate px-4 py-3 text-text-secondary" title={application.title}>
                            {application.title}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-base font-semibold text-text-primary">
                            {formatCurrency(application.totalAmount)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                                statusClass[application.status]
                              }`}
                            >
                              {statusLabel[application.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-base text-text-primary">
                            {application.receiptCount}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {application.status === "draft" ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  className="min-h-0 px-3 py-1 text-xs"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleAction("編集", application);
                                  }}
                                >
                                  編集
                                </Button>
                              ) : null}
                              {application.status === "returned" ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  className="min-h-0 px-3 py-1 text-xs"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleAction("再申請", application);
                                  }}
                                >
                                  再申請
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                variant="secondary"
                                className="min-h-0 px-3 py-1 text-xs"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleAction("詳細確認", application);
                                }}
                              >
                                詳細
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {selectedExpense ? (
          <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr,0.6fr]" aria-labelledby="detail-heading">
            <Card spacing="section" className="gap-6" role="region" aria-labelledby="detail-heading">
              <div className="flex flex-col gap-2">
                <h2 id="detail-heading" className="text-xl font-semibold text-text-primary">
                  詳細情報
                </h2>
                <p className="text-sm text-text-secondary">
                  選択中の経費申請に含まれる領収書と内訳、承認ステータスを確認できます。
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="gap-2 bg-surface-primary/70">
                  <p className="text-sm font-semibold text-text-tertiary">申請番号</p>
                  <p className="font-mono text-lg text-text-primary">{selectedExpense.referenceNumber}</p>
                </Card>
                <Card className="gap-2 bg-surface-primary/70">
                  <p className="text-sm font-semibold text-text-tertiary">合計金額</p>
                  <p className="font-mono text-lg font-bold text-text-primary">
                    {formatCurrency(selectedExpense.totalAmount)}
                  </p>
                </Card>
                <Card className="gap-2 bg-surface-primary/70">
                  <p className="text-sm font-semibold text-text-tertiary">申請日</p>
                  <p className="text-lg text-text-primary">{selectedExpense.appliedAt}</p>
                </Card>
                <Card className="gap-2 bg-surface-primary/70">
                  <p className="text-sm font-semibold text-text-tertiary">ステータス</p>
                  <span
                    className={`inline-flex items-center self-start rounded-full border px-3 py-1 text-xs font-semibold ${
                      statusClass[selectedExpense.status]
                    }`}
                  >
                    {statusLabel[selectedExpense.status]}
                  </span>
                </Card>
              </div>

              <div className="space-y-4" role="region" aria-labelledby="receipt-heading">
                <h3 id="receipt-heading" className="text-lg font-semibold text-text-primary">
                  領収書
                </h3>
                <div className="grid gap-3 md:grid-cols-3">
                  {selectedExpense.receipts.map((receipt) => (
                    <Card key={receipt.id} className="gap-3 border-border-subtle bg-surface-primary/80 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-text-primary" title={receipt.fileName}>
                          {receipt.fileName}
                        </p>
                        <span className="rounded-[var(--radius-sm)] bg-surface-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-tertiary">
                          {receipt.type}
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary">アップロード日: {receipt.uploadedAt}</p>
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-0 px-3 py-1 text-xs"
                        onClick={() => handleAction("プレビュー", selectedExpense)}
                      >
                        プレビュー
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4" role="region" aria-labelledby="line-heading">
                <h3 id="line-heading" className="text-lg font-semibold text-text-primary">
                  経費内訳
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-text-secondary">
                    <thead className="bg-surface-muted/60 text-xs uppercase tracking-wide text-text-tertiary">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-text-secondary">分類</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary">内容</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary">金額</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary">税区分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedExpense.lines.map((line) => (
                        <tr key={line.id} className="border-b border-border-subtle">
                          <td className="whitespace-nowrap px-4 py-3 text-text-primary">{line.category}</td>
                          <td className="px-4 py-3 text-text-secondary">{line.description}</td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-base font-semibold text-text-primary">
                            {formatCurrency(line.amount)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{line.taxCategory}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-6">
              <Card spacing="section" className="gap-4" role="region" aria-labelledby="history-heading">
                <div className="flex items-center justify-between">
                  <h3 id="history-heading" className="text-lg font-semibold text-text-primary">
                    承認履歴
                  </h3>
                  <span className="text-xs text-text-tertiary">最新順</span>
                </div>
                <ol className="space-y-3">
                  {selectedExpense.history.map((record) => (
                    <li key={record.id} className="rounded-[var(--radius-md)] bg-surface-primary/70 px-4 py-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-text-primary">{record.actor}</span>
                        <span className="text-xs text-text-tertiary">{record.timestamp}</span>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">{record.action}</p>
                      {record.note ? (
                        <p className="mt-2 rounded-[var(--radius-sm)] bg-surface-muted px-3 py-2 text-xs text-text-secondary">
                          {record.note}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </Card>

              <Card spacing="section" className="gap-4" role="region" aria-labelledby="next-action-heading">
                <h3 id="next-action-heading" className="text-lg font-semibold text-text-primary">
                  次のアクション
                </h3>
                <p className="text-sm text-text-secondary">
                  差戻しや下書き状態の経費は内容を修正して再申請してください。承認済み経費は会計システムとの連携準備が進行中です。
                </p>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="primary" onClick={() => router.push("/expenses")}>
                    新しい経費を申請
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleAction("PDF出力", selectedExpense)}
                  >
                    PDF 出力（準備中）
                  </Button>
                </div>
              </Card>
            </div>
          </section>
        ) : (
          <section className="mt-10" aria-live="polite">
            <Card className="gap-3 bg-surface-muted/60 p-6 text-center text-sm text-text-secondary">
              経費申請が選択されると詳細が表示されます。
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
