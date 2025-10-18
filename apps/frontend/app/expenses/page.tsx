"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  SelectField,
  TextField
} from "../../path_to_your_design_system/components";
import { getCurrentCognitoSession } from "../../lib/cognitoClient";
import { mainNavItems, type MainNavItemId } from "../navItems";

type ReceiptDraft = {
  id: string;
  fileName: string;
  uploadDate: string;
  supplier: string;
  invoiceNumber: string;
  appliedTo: string;
  amount: string;
  taxCategory: string;
  status: "new" | "processed";
};

const taxCategoryOptions = [
  { value: "taxable", label: "課税" },
  { value: "tax-reduced", label: "軽減税率" },
  { value: "tax-exempt", label: "非課税" }
];

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const formatCurrency = (value: string | number) => {
  const numeric = typeof value === "number" ? value : Number.parseFloat(value || "0");
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(
    Number.isFinite(numeric) ? numeric : 0
  );
};

const getToday = () => new Date().toISOString().slice(0, 10);

export default function ExpensesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeNav, setActiveNav] = useState<MainNavItemId>("expenses");
  const [applicationDate, setApplicationDate] = useState(getToday());
  const [applicationTitle, setApplicationTitle] = useState("9月分 Stamper 開発 経費");
  const [applicantName] = useState("宮里 康介");
  const [receipts, setReceipts] = useState<ReceiptDraft[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
        console.warn("Failed to verify Cognito session on expenses", error);
        router.replace("/");
      });

    return () => {
      canceled = true;
    };
  }, [router]);

  const totalAmount = useMemo(
    () =>
      receipts.reduce((sum, receipt) => {
        const numeric = Number.parseFloat(receipt.amount);
        if (Number.isFinite(numeric)) {
          return sum + numeric;
        }
        return sum;
      }, 0),
    [receipts]
  );

  const handleNavClick = useCallback(
    (item: (typeof mainNavItems)[number]) => {
      setActiveNav(item.id);
      router.push(item.href);
    },
    [router]
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const uploaded = Array.from(files).map<ReceiptDraft>((file) => ({
      id: generateId(),
      fileName: file.name,
      uploadDate: getToday(),
      supplier: "",
      invoiceNumber: "",
      appliedTo: "",
      amount: "0",
      taxCategory: "taxable",
      status: "new"
    }));

    setReceipts((prev) => [...prev, ...uploaded]);
    setStatusMessage(`${uploaded.length}件の領収書を追加しました。`);
    setTimeout(() => setStatusMessage(null), 3000);
    event.target.value = "";
  }, []);

  const handleReceiptChange = useCallback(
    <K extends keyof ReceiptDraft>(id: string, key: K, value: ReceiptDraft[K]) => {
      setReceipts((prev) =>
        prev.map((receipt) => (receipt.id === id ? { ...receipt, [key]: value } : receipt))
      );
    },
    []
  );

  const handleRemoveReceipt = useCallback((id: string) => {
    setReceipts((prev) => prev.filter((receipt) => receipt.id !== id));
  }, []);

  const handleDraftSave = useCallback(() => {
    setStatusMessage("下書きとして保存しました。");
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (receipts.length === 0) {
        setStatusMessage("領収書を追加してください。");
        setTimeout(() => setStatusMessage(null), 3000);
        return;
      }
      setStatusMessage("経費申請を送信しました。承認フローに進みます。");
      setTimeout(() => setStatusMessage(null), 4000);
    },
    [receipts]
  );

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-6 py-12 md:px-12">
      <span className="self-start rounded-[var(--radius-xl)] border border-border-strong bg-surface-contrast px-3 py-1 text-sm font-medium text-brand-primary">
        ExpensesPage
      </span>
      <main className="w-full max-w-6xl rounded-[var(--radius-xl)] bg-surface-shell p-10 shadow-elevated">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">経費申請</p>
            <h1 className="text-2xl font-bold text-text-primary">経費申請フォーム</h1>
            <p className="text-sm text-text-secondary">領収書をアップロードし、必要情報を入力して申請してください。</p>
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

        <form className="mt-10 flex flex-col gap-8" onSubmit={handleSubmit} noValidate>
          <Card spacing="section" className="gap-6" role="region" aria-labelledby="application-section">
            <header className="space-y-1">
              <h2 id="application-section" className="text-xl font-semibold text-text-primary">
                申請情報
              </h2>
              <p className="text-sm text-text-secondary">申請者情報は自動で入力されます。内容を確認し、必要に応じて調整してください。</p>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                id="application-date"
                label="申請日"
                type="date"
                value={applicationDate}
                onChange={(event) => setApplicationDate(event.target.value)}
              />
              <TextField
                id="applicant-name"
                label="申請者"
                value={applicantName}
                disabled
              />
              <TextField
                id="application-title"
                label="申請タイトル"
                placeholder="例: 9月分 Stamper プロジェクト経費"
                value={applicationTitle}
                onChange={(event) => setApplicationTitle(event.target.value)}
                className="md:col-span-2"
              />
            </div>
          </Card>

          <Card spacing="section" className="gap-6" role="region" aria-labelledby="upload-section">
            <header className="space-y-1">
              <h2 id="upload-section" className="text-xl font-semibold text-text-primary">
                領収書アップロード
              </h2>
              <p className="text-sm text-text-secondary">
                PNG / JPEG / PDF ファイルに対応しています。複数ファイルをまとめて選択できます。
              </p>
            </header>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-border-subtle bg-surface-muted/40 p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  multiple
                  accept="image/png,image/jpeg,application/pdf"
                  onChange={handleFileSelect}
                />
                <p className="text-sm font-semibold text-text-secondary">ここにファイルをドラッグ＆ドロップ、または</p>
                <Button type="button" variant="secondary" onClick={openFileDialog}>
                  ファイルを選択
                </Button>
                <p className="text-xs text-text-tertiary">最大 10MB / ファイル</p>
              </div>
              {receipts.length > 0 ? (
                <div className="space-y-3" aria-live="polite">
                  {receipts.map((receipt) => (
                    <Card
                      key={receipt.id}
                      className="gap-4 border-border-subtle bg-surface-primary/60"
                      role="group"
                      aria-label={`${receipt.fileName} の明細`}
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{receipt.fileName}</p>
                          <p className="text-xs text-text-tertiary">アップロード日: {receipt.uploadDate}</p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-0 px-3 py-1 text-xs"
                          onClick={() => handleRemoveReceipt(receipt.id)}
                        >
                          削除
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        <TextField
                          id={`receipt-date-${receipt.id}`}
                          label="日付"
                          type="date"
                          value={receipt.uploadDate}
                          onChange={(event) => handleReceiptChange(receipt.id, "uploadDate", event.target.value)}
                        />
                        <TextField
                          id={`receipt-supplier-${receipt.id}`}
                          label="支払先"
                          placeholder="例: 株式会社アドバンス"
                          value={receipt.supplier}
                          onChange={(event) => handleReceiptChange(receipt.id, "supplier", event.target.value)}
                        />
                        <TextField
                          id={`receipt-invoice-${receipt.id}`}
                          label="インボイス番号"
                          placeholder="例: T1234567890123"
                          value={receipt.invoiceNumber}
                          onChange={(event) => handleReceiptChange(receipt.id, "invoiceNumber", event.target.value)}
                        />
                        <TextField
                          id={`receipt-purpose-${receipt.id}`}
                          label="適用"
                          placeholder="例: ミーティング備品購入"
                          value={receipt.appliedTo}
                          onChange={(event) => handleReceiptChange(receipt.id, "appliedTo", event.target.value)}
                        />
                        <TextField
                          id={`receipt-amount-${receipt.id}`}
                          label="金額 (税込)"
                          type="number"
                          min="0"
                          step="1"
                          value={receipt.amount}
                          onChange={(event) => handleReceiptChange(receipt.id, "amount", event.target.value)}
                        />
                        <SelectField
                          id={`receipt-tax-${receipt.id}`}
                          label="税区分"
                          options={taxCategoryOptions}
                          value={receipt.taxCategory}
                          onChange={(event) => handleReceiptChange(receipt.id, "taxCategory", event.target.value)}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="rounded-[var(--radius-md)] bg-surface-muted px-4 py-3 text-sm text-text-secondary">
                  まだアップロードされた領収書はありません。
                </p>
              )}
            </div>
          </Card>

          <Card spacing="section" className="gap-6" role="region" aria-labelledby="summary-section">
            <header className="space-y-1">
              <h2 id="summary-section" className="text-xl font-semibold text-text-primary">
                集計
              </h2>
              <p className="text-sm text-text-secondary">アップロード済み領収書の合計金額と分類別内訳を確認できます。</p>
            </header>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="gap-2 bg-surface-primary/80">
                <p className="text-sm font-semibold text-text-tertiary">領収書枚数</p>
                <p className="text-2xl font-bold text-text-primary">{receipts.length} 件</p>
              </Card>
              <Card className="gap-2 bg-surface-primary/80">
                <p className="text-sm font-semibold text-text-tertiary">合計金額</p>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalAmount)}</p>
              </Card>
              <Card className="gap-2 bg-surface-primary/80">
                <p className="text-sm font-semibold text-text-tertiary">課税区分</p>
                <p className="text-sm text-text-secondary">
                  {taxCategoryOptions
                    .map((option) => {
                      const count = receipts.filter((receipt) => receipt.taxCategory === option.value).length;
                      return `${option.label}: ${count}件`;
                    })
                    .join(" / ") || "-"}
                </p>
              </Card>
            </div>
          </Card>

          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Button type="button" variant="secondary" onClick={handleDraftSave}>
              下書き保存
            </Button>
            <Button type="submit" variant="primary">
              申請する
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
