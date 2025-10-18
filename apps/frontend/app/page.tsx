"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from "react";
import { useRouter } from "next/navigation";
import { LoginPanel, Card, TextField, Button } from "../path_to_your_design_system/components";
import {
  signInWithCognito,
  completeNewPasswordChallenge,
  getCurrentCognitoSession,
  signOutFromCognito,
  type NewPasswordRequiredChallenge
} from "../lib/cognitoClient";

type ChallengeState = {
  data: NewPasswordRequiredChallenge;
  email: string;
};

function normalizeError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "ログインに失敗しました。時間をおいて再度お試しください。";
}

type NewPasswordFormProps = {
  challenge: ChallengeState;
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (newPassword: string) => Promise<void>;
  onCancel: () => void;
};

function NewPasswordForm({ challenge, isSubmitting, errorMessage, onSubmit, onCancel }: NewPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | undefined>();

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) return;

      if (!newPassword || newPassword.length < 8) {
        setLocalError("8文字以上の新しいパスワードを入力してください。");
        return;
      }

      if (newPassword !== confirmPassword) {
        setLocalError("確認用パスワードが一致しません。");
        return;
      }

      setLocalError(undefined);
      await onSubmit(newPassword);
    },
    [confirmPassword, isSubmitting, newPassword, onSubmit]
  );

  const message = useMemo(() => localError ?? errorMessage, [errorMessage, localError]);

  return (
    <Card spacing="section" className="w-full gap-6 rounded-[var(--radius-xl)] shadow-elevated">
      <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
        <header className="space-y-2">
          <h1 className="text-xl font-semibold text-text-primary">パスワードの更新が必要です</h1>
          <p className="text-sm leading-relaxed text-text-secondary">
            {challenge.email} のアカウントは初回ログインのため、新しいパスワードの設定が必要です。
          </p>
        </header>
        <TextField
          id="new-password"
          label="新しいパスワード"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          supportingText="8文字以上で、大文字・小文字・数字・記号の併用を推奨"
          disabled={isSubmitting}
        />
        <TextField
          id="confirm-password"
          label="新しいパスワード（確認）"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isSubmitting}
        />
        {message ? (
          <div
            className="rounded-[var(--radius-md)] border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent"
            role="alert"
            aria-live="assertive"
          >
            {message}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-1 min-w-[160px]">
            {isSubmitting ? "更新中..." : "パスワードを更新"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting} className="flex-1 min-w-[160px]">
            ログインに戻る
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [challenge, setChallenge] = useState<ChallengeState | undefined>();
  const [isChallengeSubmitting, setIsChallengeSubmitting] = useState(false);
  const [challengeError, setChallengeError] = useState<string | undefined>();

  useEffect(() => {
    let canceled = false;

    getCurrentCognitoSession()
      .then((session) => {
        if (canceled) return;
        if (session) {
          router.replace("/dashboard");
        }
      })
      .catch((err) => {
        console.warn("Failed to restore Cognito session", err);
      });

    return () => {
      canceled = true;
    };
  }, [router]);

  const handleSignIn = useCallback(
    async (values: { email: string; password: string; rememberMe: boolean }) => {
      setIsSubmitting(true);
      setErrorMessage(undefined);
      setSuccessMessage(undefined);
      setChallenge(undefined);
      setChallengeError(undefined);

      try {
        const result = await signInWithCognito(values);

        if (result.status === "SUCCESS") {
          setSuccessMessage("ログインに成功しました。");
          router.replace("/dashboard");
          return;
        }

        setChallenge({ data: result, email: values.email });
      } catch (error) {
        console.error("Cognito sign-in failed", error);
        if (typeof window !== "undefined") {
          (window as typeof window & { __lastAuthError?: string }).__lastAuthError =
            error instanceof Error ? error.message : String(error);
        }
        setErrorMessage(normalizeError(error));
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  const handleChallengeSubmit = useCallback(
    async (newPassword: string) => {
      if (!challenge) return;
      setIsChallengeSubmitting(true);
      setChallengeError(undefined);

      try {
        const result = await completeNewPasswordChallenge(
          challenge.data.cognitoUser,
          newPassword,
          challenge.data.userAttributes
        );

        if (result.status === "SUCCESS") {
          setSuccessMessage("パスワードを更新し、ログインしました。");
          setChallenge(undefined);
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        console.error("New password challenge failed", error);
        if (typeof window !== "undefined") {
          (window as typeof window & { __lastAuthError?: string }).__lastAuthError =
            error instanceof Error ? error.message : String(error);
        }
        setChallengeError(normalizeError(error));
      } finally {
        setIsChallengeSubmitting(false);
      }
    },
    [challenge, router]
  );

  const handleChallengeCancel = useCallback(async () => {
    await signOutFromCognito();
    setChallenge(undefined);
    setIsSubmitting(false);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
    setChallengeError(undefined);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-backdrop via-surface-muted to-surface-muted px-6 py-24">
      <span className="absolute left-6 top-6 inline-flex rounded-[var(--radius-xl)] border border-border-subtle bg-surface-contrast px-3 py-1 text-sm font-medium text-brand-primary">
        LoginPage
      </span>
      <main className="w-full max-w-lg rounded-[var(--radius-xl)] bg-surface-shell/60 p-10 backdrop-blur-sm">
        {challenge ? (
          <NewPasswordForm
            challenge={challenge}
            isSubmitting={isChallengeSubmitting}
            errorMessage={challengeError}
            onSubmit={handleChallengeSubmit}
            onCancel={handleChallengeCancel}
          />
        ) : (
          <LoginPanel
            onSubmit={handleSignIn}
            errorMessage={errorMessage}
            successMessage={successMessage}
            isSubmitting={isSubmitting}
          />
        )}
      </main>
    </div>
  );
}
