"use client";

import React from "react";
import { LoginPanel } from "../path_to_your_design_system/components";
import { signInWithCognito } from "../lib/cognitoClient";
import styles from "./page.module.css";

export default function Page() {
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();
  const [successMessage, setSuccessMessage] = React.useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleLogin = React.useCallback(async (values: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => {
    setIsSubmitting(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      const result = await signInWithCognito(values);
      console.info("Cognito sign-in succeeded", {
        idToken: result.idToken,
        accessToken: result.accessToken
      });

      setSuccessMessage("ログインに成功しました。");

      const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
      if (redirectUri && typeof window !== "undefined" && redirectUri.trim().length > 0) {
        const normalizedRedirect = redirectUri.trim();
        if (normalizedRedirect !== window.location.href) {
          window.location.assign(normalizedRedirect);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "ログインに失敗しました。";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return (
    <main className={styles.wrapper}>
      <section className={styles.panelColumn}>
        <LoginPanel
          onSubmit={handleLogin}
          errorMessage={errorMessage}
          successMessage={successMessage}
          isSubmitting={isSubmitting}
        />
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
