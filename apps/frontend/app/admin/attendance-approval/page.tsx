"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  SelectField,
  TextField
} from "../../../path_to_your_design_system/components";
import { getCurrentCognitoSession } from "../../../lib/cognitoClient";
import { mainNavItems, type MainNavItemId } from "../../navItems";

type ApprovalStatus = "pending" | "approved" | "returned";

type TimesheetEntry = {
  id: string;
  date: string;
  weekday: string;
  startTime: string;
  endTime: string;
  breakHours: number;
  totalHours: number;
  tasks: string[];
};

type ApprovalRequest = {
  id: string;
  applicant: string;
  department: string;
  month: string;
  submittedAt: string;
  status: ApprovalStatus;
  totalHours: number;
  overtimeHours: number;
  midnightHours: number;
  leaveDays: number;
  approver?: string;
  reviewedAt?: string;
  comment?: string;
  timesheet: TimesheetEntry[];
};

const approvalRequests: ApprovalRequest[] = [
  {
    id: "APR-2025-09-001",
    applicant: "宮里 康介",
    department: "開発部",
    month: "2025-09",
    submittedAt: "2025-09-30 19:42",
    status: "pending",
    totalHours: 156.5,
    overtimeHours: 18.5,
    midnightHours: 2.5,
    leaveDays: 1,
    timesheet: [
      {
        id: "2025-09-01",
        date: "2025-09-01",
        weekday: "月",
        startTime: "09:00",
        endTime: "18:30",
        breakHours: 1,
        totalHours: 8.5,
        tasks: ["Stamper開発", "UI刷新"]
      },
      {
        id: "2025-09-02",
        date: "2025-09-02",
        weekday: "火",
        startTime: "09:30",
        endTime: "21:30",
        breakHours: 1.5,
        totalHours: 10.5,
        tasks: ["OCR改善", "レビュー対応"]
      },
      {
        id: "2025-09-03",
        date: "2025-09-03",
        weekday: "水",
        startTime: "-",
        endTime: "-",
        breakHours: 0,
        totalHours: 0,
        tasks: ["(全休)"]
      }
    ]
  },
  {
    id: "APR-2025-09-004",
    applicant: "佐藤 翔太",
    department: "開発部",
    month: "2025-09",
    submittedAt: "2025-09-29 18:05",
    status: "returned",
    totalHours: 162,
    overtimeHours: 12,
    midnightHours: 0,
    leaveDays: 0,
    approver: "田中 一郎",
    reviewedAt: "2025-09-30 10:12",
    comment: "9/15 の勤怠に作業内容が未記載です。追記してください。",
    timesheet: [
      {
        id: "2025-09-28",
        date: "2025-09-28",
        weekday: "日",
        startTime: "-",
        endTime: "-",
        breakHours: 0,
        totalHours: 0,
        tasks: [""]
      }
    ]
  },
  {
    id: "APR-2025-08-010",
    applicant: "田中 一郎",
    department: "営業部",
    month: "2025-08",
    submittedAt: "2025-08-30 17:58",
    status: "approved",
    totalHours: 148,
    overtimeHours: 6,
    midnightHours: 0,
    leaveDays: 0,
    approver: "山本 花",
    reviewedAt: "2025-08-31 09:15",
    comment: "顧客対応お疲れさまでした。",
    timesheet: [
      {
        id: "2025-08-25",
        date: "2025-08-25",
        weekday: "月",
        startTime: "09:00",
        endTime: "18:00",
        breakHours: 1,
        totalHours: 8,
        tasks: ["クライアントB案件"]
      }
    ]
  }
];

const monthOptions = Array.from(
  new Map(approvalRequests.map((request) => [request.month, `${request.month.split("-")[0]}年${Number(request.month.split("-")[1])}月`]))
)
  .sort((a, b) => (a[0] > b[0] ? -1 : 1))
  .map(([value, label]) => ({ value, label }));

const statusOptions: Array<{ value: "all" | ApprovalStatus; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "pending", label: "承認待ち" },
  { value: "approved", label: "承認済み" },
  { value: "returned", label: "差戻し" }
];

const statusLabel: Record<ApprovalStatus, string> = {
  pending: "承認待ち",
  approved: "承認済み",
  returned: "差戻し"
};

const statusBadgeClass: Record<ApprovalStatus, string> = {
  pending: "border-brand-primary/40 bg-brand-primary/10 text-brand-primary",
  approved: "border-brand-secondary/40 bg-brand-secondary/10 text-brand-secondary",
  returned: "border-accent-critical/40 bg-accent-critical/10 text-accent-critical"
};

const formatCurrencyHours = (value: number) => `${value.toFixed(1)}h`;

const formatDate = (value: string) => {
  if (value.includes(" ")) {
    return value;
  }
  const instance = new Date(value);
  const month = String(instance.getMonth() + 1).padStart(2, "0");
  const day = String(instance.getDate()).padStart(2, "0");
  return `${month}/${day}`;
};

export default function AttendanceApprovalPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeNav, setActiveNav] = useState<MainNavItemId | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0]?.value ?? "");
  const [selectedStatus, setSelectedStatus] = useState<"all" | ApprovalStatus>("pending");
  const [keyword, setKeyword] = useState("");
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [returnComment, setReturnComment] = useState<string>("");

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
        console.warn("Failed to verify Cognito session on attendance approval", error);
        router.replace("/");
      });

    return () => {
      canceled = true;
    };
  }, [router]);

  const filteredApprovals = useMemo(() => {
    return approvalRequests.filter((request) => {
      const matchesMonth = selectedMonth ? request.month === selectedMonth : true;
      const matchesStatus = selectedStatus === "all" ? true : request.status === selectedStatus;
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchesKeyword = normalizedKeyword
        ? request.applicant.toLowerCase().includes(normalizedKeyword) ||
          request.id.toLowerCase().includes(normalizedKeyword) ||
          request.department.toLowerCase().includes(normalizedKeyword)
        : true;
      return matchesMonth && matchesStatus && matchesKeyword;
    });
  }, [keyword, selectedMonth, selectedStatus]);

  useEffect(() => {
    if (filteredApprovals.length === 0) {
      setSelectedApprovalId(null);
      return;
    }
    setSelectedApprovalId((prev) => {
      if (!prev) return filteredApprovals[0]?.id ?? null;
      const stillExists = filteredApprovals.some((request) => request.id === prev);
      return stillExists ? prev : filteredApprovals[0]?.id ?? null;
    });
  }, [filteredApprovals]);

  const selectedApproval = useMemo(
    () => filteredApprovals.find((request) => request.id === selectedApprovalId) ?? null,
    [filteredApprovals, selectedApprovalId]
  );

  const summary = useMemo(() => {
    return approvalRequests.reduce(
      (acc, request) => {
        acc.total += 1;
        acc[request.status] += 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, returned: 0 } as { total: number; pending: number; approved: number; returned: number }
    );
  }, []);

  const handleNavClick = useCallback(
    (item: (typeof mainNavItems)[number]) => {
      setActiveNav(item.id);
      router.push(item.href);
    },
    [router]
  );

  const handleApprove = useCallback(() => {
    if (!selectedApproval) return;
    setActionMessage(`「${selectedApproval.applicant}」の勤怠を承認しました。（モック）`);
    setReturnComment("");
    setTimeout(() => setActionMessage(null), 3200);
  }, [selectedApproval]);

  const handleReturn = useCallback(() => {
    if (!selectedApproval) return;
    if (!returnComment.trim()) {
      setActionMessage("差戻しコメントを入力してください。");
      setTimeout(() => setActionMessage(null), 2500);
      return;
    }
    setActionMessage(`「${selectedApproval.applicant}」の勤怠を差戻しました。（モック）`);
    setTimeout(() => setActionMessage(null), 3200);
  }, [returnComment, selectedApproval]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-12 md:px-12">
      <span className="self-start rounded-[var(--radius-xl)] border border-border-strong bg-surface-contrast px-3 py-1 text-sm font-medium text-brand-primary">
        AttendanceApprovalPage
      </span>
      <main className="w-full max-w-6xl rounded-[var(--radius-xl)] bg-surface-shell p-10 shadow-elevated">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">管理者</p>
            <h1 className="text-2xl font-bold text-text-primary">勤怠承認</h1>
            <p className="text-sm text-text-secondary">
              提出済みの勤怠申請を確認し、承認または差戻しを実施します。フィルターを組み合わせて優先度の高い申請から処理してください。
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

        {actionMessage ? (
          <div
            className="mt-8 rounded-[var(--radius-md)] border border-brand-secondary/40 bg-brand-secondary/10 px-4 py-3 text-sm text-brand-secondary"
            role="status"
            aria-live="polite"
          >
            {actionMessage}
          </div>
        ) : null}

        <section className="mt-10 grid gap-4 md:grid-cols-4" aria-label="承認状況サマリー">
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">総申請数</p>
            <p className="text-2xl font-bold text-text-primary">{summary.total}</p>
          </Card>
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">承認待ち</p>
            <p className="text-2xl font-bold text-text-primary">{summary.pending}</p>
          </Card>
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">承認済み</p>
            <p className="text-2xl font-bold text-text-primary">{summary.approved}</p>
          </Card>
          <Card className="gap-2 bg-surface-primary/80">
            <p className="text-sm font-semibold text-text-tertiary">差戻し</p>
            <p className="text-2xl font-bold text-text-primary">{summary.returned}</p>
          </Card>
        </section>

        <section className="mt-10 flex flex-col gap-6" aria-labelledby="filters-heading">
          <div className="flex flex-wrap items-end gap-4" role="group" aria-labelledby="filters-heading">
            <div className="space-y-2">
              <h2 id="filters-heading" className="text-xl font-semibold text-text-primary">
                フィルター条件
              </h2>
              <p className="text-sm text-text-secondary">対象月・ステータス・キーワードで絞り込みできます。</p>
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
                onChange={(event) => setSelectedStatus(event.target.value as "all" | ApprovalStatus)}
                options={statusOptions}
                className="min-w-[200px]"
              />
              <TextField
                id="filter-keyword"
                label="検索"
                placeholder="申請者・部署・申請番号"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="min-w-[240px]"
              />
            </div>
          </div>

          <Card spacing="section" className="gap-6" role="region" aria-labelledby="approval-table-heading">
            <div className="flex items-center justify-between gap-4">
              <h3 id="approval-table-heading" className="text-lg font-semibold text-text-primary">
                申請一覧
              </h3>
              <p className="text-xs text-text-tertiary">結果は最大20件まで表示（モックデータ）。</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[920px] border-separate border-spacing-0 text-left text-sm text-text-secondary">
                <thead className="bg-surface-muted/60 text-xs uppercase tracking-wide text-text-tertiary">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-text-secondary">申請番号</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">申請者</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">部署</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">対象月</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">申請日時</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">ステータス</th>
                    <th className="px-4 py-3 font-semibold text-text-secondary">稼働時間</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApprovals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-text-secondary">
                        条件に一致する申請がありません。
                      </td>
                    </tr>
                  ) : (
                    filteredApprovals.map((request) => {
                      const isSelected = request.id === selectedApprovalId;
                      return (
                        <tr
                          key={request.id}
                          className={`border-b border-border-subtle transition hover:bg-surface-muted/60 ${
                            isSelected ? "bg-surface-muted/40" : ""
                          }`}
                          onClick={() => setSelectedApprovalId(request.id)}
                        >
                          <td className="px-4 py-3 font-mono text-base font-semibold text-text-primary">{request.id}</td>
                          <td className="px-4 py-3 text-text-secondary">{request.applicant}</td>
                          <td className="px-4 py-3 text-text-secondary">{request.department}</td>
                          <td className="px-4 py-3 text-text-secondary">{request.month}</td>
                          <td className="px-4 py-3 text-text-secondary">{request.submittedAt}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                                statusBadgeClass[request.status]
                              }`}
                            >
                              {statusLabel[request.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-base text-text-primary">
                            {formatCurrencyHours(request.totalHours)}
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

        {selectedApproval ? (
          <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]" aria-labelledby="detail-heading">
            <Card spacing="section" className="gap-6" role="region" aria-labelledby="detail-heading">
              <header className="flex flex-col gap-2">
                <h2 id="detail-heading" className="text-xl font-semibold text-text-primary">
                  申請詳細
                </h2>
                <p className="text-sm text-text-secondary">
                  勤怠サマリーと日別の勤怠情報を確認してください。承認・差戻し操作は右側から実施できます。
                </p>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="gap-2 bg-surface-primary/70">
                  <p className="text-sm font-semibold text-text-tertiary">申請者</p>
                  <p className="text-lg font-semibold text-text-primary">{selectedApproval.applicant}</p>
                  <p className="text-xs text-text-tertiary">{selectedApproval.department}</p>
                </Card>
                <Card className="gap-2 bg-surface-primary/70">
                  <p className="text-sm font-semibold text-text-tertiary">対象月</p>
                  <p className="text-lg text-text-primary">{selectedApproval.month}</p>
                  <p className="text-xs text-text-tertiary">申請: {selectedApproval.submittedAt}</p>
                </Card>
                <Card className="gap-2 bg-surface-primary/70">
                  <p className="text-sm font-semibold text-text-tertiary">稼働時間合計</p>
                  <p className="font-mono text-2xl font-bold text-text-primary">
                    {formatCurrencyHours(selectedApproval.totalHours)}
                  </p>
                </Card>
                <Card className="gap-2 bg-surface-primary/70">
                  <p className="text-sm font-semibold text-text-tertiary">残業 / 深夜 / 休暇</p>
                  <p className="text-sm text-text-primary">
                    残業 {formatCurrencyHours(selectedApproval.overtimeHours)} / 深夜 {formatCurrencyHours(selectedApproval.midnightHours)} /
                    休暇 {selectedApproval.leaveDays}日
                  </p>
                </Card>
              </div>

              {selectedApproval.comment ? (
                <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-primary/70 p-4 text-sm text-text-secondary">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">最新コメント</span>
                    <span className="text-xs text-text-tertiary">
                      {selectedApproval.approver ?? "-"} {selectedApproval.reviewedAt ?? ""}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap">{selectedApproval.comment}</p>
                </div>
              ) : null}

              <div className="space-y-4" role="region" aria-labelledby="timesheet-heading">
                <h3 id="timesheet-heading" className="text-lg font-semibold text-text-primary">
                  勤怠詳細
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-text-secondary">
                    <thead className="bg-surface-muted/60 text-xs uppercase tracking-wide text-text-tertiary">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-text-secondary">日付</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary">曜日</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary">開始</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary">終了</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary">休憩</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary">合計</th>
                        <th className="px-4 py-3 font-semibold text-text-secondary">作業内容</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedApproval.timesheet.map((entry) => (
                        <tr key={entry.id} className="border-b border-border-subtle">
                          <td className="px-4 py-3 font-semibold text-text-primary">{formatDate(entry.date)}</td>
                          <td className="px-4 py-3 text-text-secondary">{entry.weekday}</td>
                          <td className="px-4 py-3 font-mono text-base text-text-primary">{entry.startTime}</td>
                          <td className="px-4 py-3 font-mono text-base text-text-primary">{entry.endTime}</td>
                          <td className="px-4 py-3 font-mono text-base text-text-primary">{entry.breakHours.toFixed(1)}h</td>
                          <td className="px-4 py-3 font-mono text-base font-semibold text-text-primary">{entry.totalHours.toFixed(1)}h</td>
                          <td className="px-4 py-3 text-text-secondary">
                            {entry.tasks.filter(Boolean).length > 0 ? entry.tasks.filter(Boolean).join("、") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-6">
              <Card spacing="section" className="gap-6" role="region" aria-labelledby="action-heading">
                <header>
                  <h3 id="action-heading" className="text-lg font-semibold text-text-primary">
                    承認アクション
                  </h3>
                  <p className="text-sm text-text-secondary">
                    承認または差戻しを選択してください。差戻し時はコメント入力が必須です。
                  </p>
                </header>
                <div className="space-y-4">
                  <Button type="button" variant="primary" onClick={handleApprove}>
                    承認する
                  </Button>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-secondary" htmlFor="return-comment">
                      差戻しコメント
                    </label>
                    <textarea
                      id="return-comment"
                      className="min-h-[120px] w-full rounded-[var(--radius-md)] border border-border-subtle bg-surface-primary px-[var(--input-padding-x)] py-[var(--input-padding-y)] text-sm text-text-primary shadow-inner transition focus-visible:outline-none focus-visible:border-brand-primary focus-visible:ring-4 focus-visible:ring-brand-primary/15"
                      placeholder="差戻し理由を入力してください"
                      value={returnComment}
                      onChange={(event) => setReturnComment(event.target.value)}
                    />
                  </div>
                  <Button type="button" variant="secondary" onClick={handleReturn}>
                    差戻す
                  </Button>
                </div>
              </Card>

              <Card spacing="section" className="gap-4" role="region" aria-labelledby="export-heading">
                <div className="flex items-center justify-between">
                  <h3 id="export-heading" className="text-lg font-semibold text-text-primary">
                    添付資料
                  </h3>
                  <span className="text-xs text-text-tertiary">モックデータ</span>
                </div>
                <div className="space-y-2 text-sm text-text-secondary">
                  <p>勤務表 PDF と CSV は承認時に自動添付される想定です。</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setActionMessage("PDFプレビューは現在準備中です。");
                        setTimeout(() => setActionMessage(null), 2200);
                      }}
                    >
                      PDF を表示（準備中）
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setActionMessage("CSVダウンロードは現在準備中です。");
                        setTimeout(() => setActionMessage(null), 2200);
                      }}
                    >
                      CSV をダウンロード（準備中）
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        ) : (
          <section className="mt-10" aria-live="polite">
            <Card className="gap-3 bg-surface-muted/60 p-6 text-center text-sm text-text-secondary">
              申請が選択されると詳細が表示されます。
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
