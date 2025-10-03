# Dev Container (VS Code)

このリポジトリは VS Code Dev Containers での開発をサポートしています。Next.js と AWS SAM (TypeScript/Python) の開発に必要なツールを同一コンテナで提供します。

## 使い方

1. VS Code でこのリポジトリを開く（WSL 上を推奨）
2. コマンドパレットで「Dev Containers: Reopen in Container」を実行
3. コンテナ起動後、自動で `npm ci` が実行されます

### よく使うコマンド（コンテナ内）

- モノレポ全体の開発サーバー
  - `npm run dev`
- フロントエンドのみ（Next.js）
  - `npx turbo run dev --filter=@stamper/frontend`
- バックエンド（TypeScript / SAM Local）
  - `cd apps/backend-ts && sam build`
  - `sam local start-api --port 8000`
- バックエンド（Python / SAM Local）
  - `cd apps/backend-py && sam build`
  - `sam local start-api --port 9000`

> SAM Local は Docker を利用します。本 Dev Container は docker-outside-of-docker 構成のため、ホストの Docker デーモンに接続します。

## AWS 認証情報

ホスト側の `~/.aws` をコンテナの `/home/node/.aws` にマウントしています。プロファイルを利用する場合は、ホスト側で設定してください。

## ポート

- 3000: Next.js (frontend)
- 8000: SAM Local (backend-ts)
- 9000: SAM Local (backend-py)

必要に応じて `.devcontainer/devcontainer.json` の `forwardPorts` を変更してください。
