## Why
バックエンドの未整備な API を最小限の責務で明確化し、実装チームが段階的に作業できるようにする。

## What Changes
- `auth`、`categories`、`health` の各ハンドラについて、バックエンド API を明文化したスペックデルタを追加する。
- 最低限の受け入れシナリオ（ログイン成功/失敗、カテゴリ一覧取得、ヘルスチェック）を追加する。

## Impact
- 影響を受ける能力: `auth`, `categories`, `health`
- 影響を受けるコード: `apps/backend-ts/src/handlers/*`（既存のハンドラを参照・修正する可能性あり）

## Assumptions
- 既存の TypeScript ハンドラ群が存在し、最初は最小限の API 動作を追加または明確化するだけでよい。
- 認証は JWT ベースで、既存の `lib/jwt.ts` などを利用する想定。
