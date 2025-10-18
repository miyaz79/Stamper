"use client";

import { useState, type FormEvent } from "react";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { TextField } from "../TextField/TextField";
import { TextLink } from "../TextLink/TextLink";

type LoginPanelProps = {
  onSubmit?: (values: { email: string; password: string; rememberMe: boolean }) => void | Promise<void>;
  errorMessage?: string;
  successMessage?: string;
  isSubmitting?: boolean;
};

export function LoginPanel({ onSubmit, errorMessage, successMessage, isSubmitting = false }: LoginPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }
    setError(undefined);
    try {
      await onSubmit?.({ email, password, rememberMe });
    } catch (submitError) {
      console.error("Login submission failed", submitError);
    }
  };

  const combinedError = error ?? errorMessage;

  return (
    <Card spacing="section" aria-labelledby="login-title" className="w-full">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-tr from-brand-primary to-brand-primary-dark text-lg font-semibold text-text-inverse">
          St
        </div>
        <span className="text-xl font-semibold text-text-primary">Stamper</span>
      </div>
      <div className="space-y-2">
        <h1 id="login-title" className="text-2xl font-bold text-text-primary">
          ログイン
        </h1>
        <p className="text-sm leading-relaxed text-text-secondary">
          勤怠管理と経費申請を統合したStamperにサインインしてください。
        </p>
      </div>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
        <TextField
          id="email"
          label="メールアドレス"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          errorText={!email && error ? "入力してください" : undefined}
          disabled={isSubmitting}
        />
        <TextField
          id="password"
          label="パスワード"
          type="password"
          placeholder="8文字以上のパスワード"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          errorText={!password && error ? "入力してください" : undefined}
          disabled={isSubmitting}
        />
        <div className="flex flex-col gap-4">
          <Button type="submit" fluid aria-label="Stamperにログイン" disabled={isSubmitting} aria-busy={isSubmitting}>
            ログイン
          </Button>
          {combinedError ? (
            <div
              className="rounded-[var(--radius-md)] border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent"
              role="alert"
              aria-live="assertive"
            >
              {combinedError}
            </div>
          ) : successMessage ? (
            <div
              className="rounded-[var(--radius-md)] border border-brand-secondary/30 bg-brand-secondary/10 px-4 py-3 text-sm text-brand-secondary"
              role="status"
              aria-live="polite"
            >
              {successMessage}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <label className="inline-flex items-center gap-2 text-text-secondary" htmlFor="rememberMe">
              <input
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 rounded border border-border-subtle text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                disabled={isSubmitting}
              />
              次回から自動的にログイン
            </label>
            <TextLink href="#password-reset">パスワードをお忘れの方</TextLink>
          </div>
        </div>
      </form>
      <TextLink href="#help">ログインに関するヘルプを見る</TextLink>
    </Card>
  );
}