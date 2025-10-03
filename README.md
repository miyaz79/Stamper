# プロジェクト構成ドキュメント

## 1\. 概要

このプロジェクトは、フロントエンドにNext.js、バックエンドにAWS Lambda (TypeScript/Python) を採用し、**Turborepo**を利用してモノリポ構成で管理します。

この構成により、フロントエンドとバックエンド間で型安全な連携を実現しつつ、各サービスの役割に応じた最適な言語選択と、効率的な開発・デプロイを目指します。

-----

## 2\. 技術スタック

| 領域 | 技術 | 役割 |
| :--- | :--- | :--- |
| **全体管理** | Turborepo | モノリポ管理、ビルド・テストの高速化 |
| **フロントエンド** | Next.js, React, TypeScript | UI/UXの構築、クライアントサイドロジック |
| **バックエンド(TS)** | AWS SAM, TypeScript, Node.js | 一般的なAPI、リアルタイム通信などの実装 |
| **バックエンド(Python)**| AWS SAM, Python | AI/機械学習モデルの呼び出し、重たいデータ処理 |
| **インフラ** | AWS (Lambda, API Gateway, etc.) | サーバーレスなバックエンドの実行環境 |
| **パッケージ管理** | npm / yarn / pnpm (Workspaces) | 依存関係の管理 |

-----

## 3\. ディレクトリ構造

プロジェクトは`apps`（アプリケーション）と`packages`（共有コード）の2つの主要なディレクトリで構成されます。

```plaintext
Stamper/
├── apps/
│   ├── frontend/                 # Next.js (App Router) フロントエンド
│   │   ├── app/                  # ルーティングとページエントリ
│   │   ├── path_to_your_design_system/
│   │   │   ├── components/       # Design System コンポーネント群
│   │   │   ├── styles/           # CSS カスタムプロパティ (tokens.css)
│   │   │   └── tokens.ts         # トークンのTypeScriptエクスポート
│   │   ├── types/                # CSS Modules 型定義
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   ├── backend-ts/               # TypeScript製LambdaのAWS SAMプロジェクト
│   │   ├── src/handlers/
│   │   ├── package.json
│   │   └── template.yaml
│   │
│   └── backend-py/               # Python製LambdaのAWS SAMプロジェクト
│       ├── src/handlers/
│       ├── requirements.txt
│       └── template.yaml
│
├── packages/
│   ├── types/
│   ├── tsconfig/
│   └── eslint-config/
│
├── docs/                         # 仕様書・デザイン成果物
├── package.json                  # モノリポ全体の管理ファイル
├── turbo.json                    # Turborepo設定
└── README.md                     # 本ドキュメント
```

### `apps`

デプロイされる独立したアプリケーションを配置します。

  * **`frontend`**: Next.js (App Router) アプリ。Design System (`path_to_your_design_system`) と画面実装を内包します。
  * **`backend-ts`**: TypeScriptで記述されたLambda関数を管理するAWS SAMプロジェクト。
  * **`backend-py`**: Pythonで記述されたLambda関数を管理するAWS SAMプロジェクト。

### `packages`

複数のアプリケーション間で共有されるコードを配置します。

  * **`types`**: **[最重要]** APIのレスポンス型など、フロントエンドとTypeScriptバックエンドで共有する型定義を格納します。これにより、型安全な開発を実現します。
  * **`tsconfig` / `eslint-config`**: TypeScriptやESLintの設定を共通化し、コード品質をリポジトリ全体で統一します。

-----

## 4\. 開発フロー

### a. 環境構築

1.  リポジトリをクローンします。
2.  プロジェクトのルートディレクトリで、以下のコマンドを実行し、全ての依存関係をインストールします。
    ```bash
    npm install
    ```

### b. ローカル開発

以下のコマンドをルートディレクトリで実行すると、Turborepoがフロントエンドとバックエンドの開発サーバーを同時に起動します。

```bash
npm install
npm run dev
```

### c. コードの共有方法

`packages/types` は `@stamper/types` として公開されており、各アプリケーションから次のように参照します。

```typescript
// 例: apps/frontend/app/page.tsx など
import type { AttendanceSummary } from "@stamper/types";

const summary: AttendanceSummary = {
  /* ... */
};
```

### d. デプロイ

デプロイは、各アプリケーションディレクトリに移動して行います。

**フロントエンド (Vercelなど)**

```bash
cd apps/frontend
# Vercel CLIなどを使ってデプロイ
vercel deploy
```

**バックエンド (AWS SAM)**

```bash
# TypeScriptバックエンド
cd apps/backend-ts
sam build && sam deploy

# Pythonバックエンド
cd apps/backend-py
sam build && sam deploy
```

CI/CDパイプラインを構築することで、これらのデプロイプロセスを自動化することを推奨します。

### WAFの社内IPレンジ（プレースホルダー）
SAMの `template.yaml` に `EnableWAF` と `AllowedIpCidrs` パラメータを用意しています。IPが確定するまで `EnableWAF=false` で進め、確定後に `AllowedIpCidrs` を置き換え、`EnableWAF=true` で再デプロイしてください。

-----

## 5\. コマンド一覧

主要なコマンドは、ルートディレクトリの`package.json`に定義されています。

| コマンド | 説明 |
| :--- | :--- |
| `npm run dev` | 全てのアプリケーションを開発モードで起動します。 |
| `npm run build`| 全てのアプリケーションをビルドします。 |
| `npm run lint` | 全てのアプリケーションのコードを静的解析します。 |
| `npm run test` | 全てのアプリケーションのテストを実行します。 |

-----

## 6\. フロントエンド開発ガイド

デザインシステムや画面実装のベストプラクティスは `apps/frontend/README.md` に集約しています。UI を更新する際はそちらを参照し、トークンやコンポーネントの追加ルールを遵守してください。


## 7. Dev Container での開発

VS Code の Dev Containers を利用して、統一された開発環境を再現できます。Docker Desktop と WSL2 の併用を推奨します。

1. VS Code で本リポジトリを開く（WSL: Ubuntu 上を推奨）
2. コマンドパレットで「Dev Containers: Reopen in Container」を実行
3. コンテナ起動後、自動で `npm ci` が走ります

コンテナ内で以下のコマンドを利用できます。

- 全体の開発: `npm run dev`
- フロントのみ: `npx turbo run dev --filter=@stamper/frontend`
- SAM Local (TS): `cd apps/backend-ts && sam build && sam local start-api --port 8000`
- SAM Local (Py): `cd apps/backend-py && sam build && sam local start-api --port 9000`

AWS 認証情報は、ホストの `~/.aws` を `/home/node/.aws` にマウントして利用します。詳細は `.devcontainer/README.md` を参照してください。

