"use client";

import React from "react";
import { Button, Card, LoginPanel, TextField } from "../path_to_your_design_system/components";
import {
  completeNewPasswordChallenge,
  signInWithCognito,
  type NewPasswordRequiredChallenge,
  type SignInSuccess
} from "../lib/cognitoClient";
import styles from "./page.module.css";

export default function Page() {
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();
  const [successMessage, setSuccessMessage] = React.useState<string | undefined>();
  const [challengeNotice, setChallengeNotice] = React.useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [challenge, setChallenge] = React.useState<NewPasswordRequiredChallenge | undefined>();
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [newPasswordError, setNewPasswordError] = React.useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = React.useState<string | undefined>();

  const handleAuthSuccess = React.useCallback((result: SignInSuccess) => {
    console.info("Cognito sign-in succeeded", {
      idToken: result.idToken,
      accessToken: result.accessToken
    });

    setChallenge(undefined);
    setChallengeNotice(undefined);
    setErrorMessage(undefined);
    setSuccessMessage("ログインに成功しました。");

    const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
    if (redirectUri && typeof window !== "undefined" && redirectUri.trim().length > 0) {
      const normalizedRedirect = redirectUri.trim();
      if (normalizedRedirect !== window.location.href) {
        window.location.assign(normalizedRedirect);
      }
    }
  }, []);

  const handleLogin = React.useCallback(async (values: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
     setChallengeNotice(undefined);

    try {
      const response = await signInWithCognito(values);

      if (response.status === "NEW_PASSWORD_REQUIRED") {
        setChallenge(response);
        setChallengeNotice("初回ログインのため、新しいパスワードを設定してください。");
        setNewPassword("");
        setConfirmPassword("");
        setNewPasswordError(undefined);
        setConfirmPasswordError(undefined);
        return;
      }

      handleAuthSuccess(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ログインに失敗しました。";
      setErrorMessage(message);
      setChallenge(undefined);
      setChallengeNotice(undefined);
    } finally {
      setIsSubmitting(false);
    }
  }, [handleAuthSuccess]);

  const handleCompleteNewPassword = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!challenge) {
        setErrorMessage("セッションが無効です。お手数ですが再度ログインしてください。");
        setChallengeNotice(undefined);
        return;
      }

      setErrorMessage(undefined);
      setSuccessMessage(undefined);
      setNewPasswordError(undefined);
      setConfirmPasswordError(undefined);

      if (newPassword.length < 8) {
        setNewPasswordError("8文字以上のパスワードを入力してください。");
        return;
      }

      if (newPassword !== confirmPassword) {
        setConfirmPasswordError("確認用パスワードが一致しません。");
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await completeNewPasswordChallenge(
          challenge.cognitoUser,
          newPassword,
          challenge.userAttributes
        );
        setNewPassword("");
        setConfirmPassword("");
        handleAuthSuccess(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "パスワードの更新に失敗しました。";
        setErrorMessage(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [challenge, confirmPassword, handleAuthSuccess, newPassword]
  );

  const showLoginPanel = !challenge;

  return (
    <main className={styles.wrapper}>
      <section className={styles.panelColumn}>
        {showLoginPanel ? (
          <LoginPanel
            onSubmit={handleLogin}
            errorMessage={errorMessage}
            successMessage={successMessage}
            isSubmitting={isSubmitting}
          />
        ) : (
          <Card spacing="section" aria-labelledby="new-password-title">
            <div className={styles.newPasswordContainer}>
              <div>
                <h1 id="new-password-title" className={styles.newPasswordHeading}>
                  初回パスワード設定
                </h1>
                <p className={styles.newPasswordDescription}>
                  初回ログインのため、新しいパスワードを入力してください。
                </p>
                {challengeNotice ? (
                  <div className={styles.feedbackNotice} role="status" aria-live="polite">
                    {challengeNotice}
                  </div>
                ) : null}
                {errorMessage ? (
                  <div className={styles.feedbackError} role="alert" aria-live="assertive">
                    {errorMessage}
                  </div>
                ) : null}
              </div>
              <form className={styles.newPasswordForm} onSubmit={handleCompleteNewPassword} noValidate>
                <TextField
                  id="newPassword"
                  label="新しいパスワード"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    if (newPasswordError) setNewPasswordError(undefined);
                  }}
                  required
                  errorText={newPasswordError}
                  disabled={isSubmitting}
                />
                <TextField
                  id="confirmNewPassword"
                  label="新しいパスワード（確認）"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (confirmPasswordError) setConfirmPasswordError(undefined);
                  }}
                  required
                  errorText={confirmPasswordError}
                  disabled={isSubmitting}
                />
                <div className={styles.newPasswordActions}>
                  <Button type="submit" fluid disabled={isSubmitting} aria-busy={isSubmitting}>
                    パスワードを更新してログイン
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}
      </section>
      <section className={styles.heroColumn} aria-label="Stamperの特長">
        <span className={styles.heroBadge}>Time &amp; Expense Platform</span>
        <h2 className={styles.heroHeading}>
          働き方を可視化し、勤怠と経費の管理をもっとスマートに。
        </h2>
        <p className={styles.heroBody}>
          Stamperは日々の勤怠打刻から月次の承認フロー、経費申請までをワンストップで提供します。
          データの整合性を保ちながらチーム全体の生産性を高めましょう。
        </p>
      </section>
    </main>
  );
}
