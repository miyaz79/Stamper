"use client";

import React from "react";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { TextField } from "../TextField/TextField";
import { TextLink } from "../TextLink/TextLink";
import styles from "./LoginPanel.module.css";

type LoginPanelProps = {
  onSubmit?: (values: { email: string; password: string; rememberMe: boolean }) => void;
};

export function LoginPanel({ onSubmit }: LoginPanelProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }
    setError(undefined);
    onSubmit?.({ email, password, rememberMe });
  };

  return (
  <Card spacing="section" aria-labelledby="login-title">
      <div className={styles.container}>
        <div className={styles.logo}>
          <div className={styles.logoMark} aria-hidden>St</div>
          <span className={styles.logoText}>Stamper</span>
        </div>
        <div>
          <h1 id="login-title" className={styles.headline}>
            ログイン
          </h1>
          <p className={styles.subhead}>
            勤怠管理と経費申請を統合したStamperにサインインしてください。
          </p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
          />
          <div className={styles.actions}>
            <Button type="submit" fluid aria-label="Stamperにログイン">
              ログイン
            </Button>
            {error ? (
              <div className={styles.errorBanner} role="alert" aria-live="assertive">
                {error}
              </div>
            ) : null}
            <div className={styles.linksRow}>
              <label className={styles.rememberLabel} htmlFor="rememberMe">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                次回から自動的にログイン
              </label>
              <TextLink href="#password-reset">パスワードをお忘れの方</TextLink>
            </div>
          </div>
        </form>
        <TextLink href="#help">ログインに関するヘルプを見る</TextLink>
      </div>
    </Card>
  );
}