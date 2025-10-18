"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LoginPanel, Card, TextField, Button } from "../path_to_your_design_system/components";
import styles from "./login.module.css";
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
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [localError, setLocalError] = React.useState<string | undefined>();

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
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

  return (
    <Card spacing="section" className={styles.challengeCard}>
      <form className={styles.challengeForm} onSubmit={handleSubmit} noValidate>
        <header className={styles.challengeHeader}>
          <h1>パスワードの更新が必要です</h1>
          <p>
            {challenge.email}
            のアカウントは初回ログインのため、新しいパスワードの設定が必要です。
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
        {(localError || errorMessage) ? (
          <div className={styles.challengeError} role="alert" aria-live="assertive">
            {localError ?? errorMessage}
          </div>
        ) : null}
        <div className={styles.challengeActions}>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "更新中..." : "パスワードを更新"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            ログインに戻る
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();
  const [successMessage, setSuccessMessage] = React.useState<string | undefined>();
  const [challenge, setChallenge] = React.useState<ChallengeState | undefined>();
  const [isChallengeSubmitting, setIsChallengeSubmitting] = React.useState(false);
  const [challengeError, setChallengeError] = React.useState<string | undefined>();

  React.useEffect(() => {
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

  const handleSignIn = React.useCallback(
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

  const handleChallengeSubmit = React.useCallback(
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

  const handleChallengeCancel = React.useCallback(async () => {
    await signOutFromCognito();
    setChallenge(undefined);
    setIsSubmitting(false);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
    setChallengeError(undefined);
  }, []);

  return (
    <div className={styles.page}>
      <span className={styles.pageLabel}>LoginPage</span>
      <main className={styles.shell}>
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
