# Stamper Frontend

Next.js (App Router) を用いたフロントエンド実装のための開発ガイドです。Design System、スタイルガイド、ビルド手順をここに集約し、UI 改修の際は本ドキュメントを参照してください。

## 目次

- [Stamper Frontend](#stamper-frontend)
  - [目次](#目次)
  - [概要](#概要)
  - [セットアップ](#セットアップ)
  - [推奨コマンド](#推奨コマンド)
  - [ディレクトリ構成](#ディレクトリ構成)
  - [Design System の利用](#design-system-の利用)
    - [コンポーネント追加フロー](#コンポーネント追加フロー)
  - [スタイルガイド](#スタイルガイド)
  - [アクセシビリティ](#アクセシビリティ)
  - [テストとビルド](#テストとビルド)
  - [よくあるタスク](#よくあるタスク)
    - [新しいページを追加したい](#新しいページを追加したい)
    - [ログイン画面の文言/挙動を調整したい](#ログイン画面の文言挙動を調整したい)
    - [デザインカンプを取り込む場合](#デザインカンプを取り込む場合)

## 概要

- **フレームワーク**: Next.js 14 App Router、React 18、TypeScript
- **デザイン基盤**: `/app/globals.css` と `path_to_your_design_system` 配下のトークン／コンポーネント
- **CSS 管理**: Tailwind CSS（Design Tokens を取り込んだテーマ拡張）
- **ビルド管理**: Turborepo（ルートの `npm run dev/build/...` か、フィルター付きで部分実行）

## セットアップ

```bash
# ルートで依存関係をインストール
npm install

# フロントエンドだけ開発サーバーを起動したい場合
npx turbo run dev --filter=@stamper/frontend

# もしくはモノリポ全体を起動
npm run dev
```

> **Tip:** `npm run dev` はバックエンドのウォッチも起動します。フロントエンドのみで十分な場合は `turbo run` のフィルターを推奨します。

## 推奨コマンド

| コマンド | 説明 |
| :--- | :--- |
| `npm run lint --workspace @stamper/frontend` | ESLint による静的解析 |
| `npm run build --workspace @stamper/frontend` | 本番ビルド（型チェック込み） |
| `npm run dev --workspace @stamper/frontend` | Next.js 開発サーバー (ポート 3000) |

## ディレクトリ構成

```plaintext
apps/frontend/
├── app/
│   ├── layout.tsx           # ルートレイアウト（フォント、グローバルCSS適用）
│   └── page.tsx             # ログイン画面 (Client Component)
├── path_to_your_design_system/
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── LoginPanel/
│   │   ├── TextField/
│   │   └── TextLink/
│   ├── styles/tokens.css    # CSS カスタムプロパティ（デザイントークン）
│   └── tokens.ts            # TypeScript から利用するトークン
├── types/global.d.ts        # 環境変数などの型定義
├── globals.css              # App Router 用グローバルスタイル
├── next.config.js
└── package.json
```

## Design System の利用

- **トークン参照**: `tokens.css` で定義したカスタムプロパティを Tailwind (`tailwind.config.ts`) にマッピング済みです。TypeScript でトークン値が必要な場合は `tokens.ts` をインポートしてください。
- **コンポーネント**: `path_to_your_design_system/components/index.ts` で主要コンポーネントをエクスポート。新規 UI は既存コンポーネントを組み合わせ、再利用が難しい場合のみ追加します。
- **ドキュメント**: `LoginPanel/README.md` に代表的な使い方を記載。新しいコンポーネントを追加する際は README を同ディレクトリに作成してください。
- 重要: `/path_to_your_design_system`のコンポーネントを可能な限り毎回使用してください。
- デザインを正確に一致させるために、Figmaの忠実度を優先してください。
- ハードコードされた値を避け、Figmaのデザイントークンが利用可能な場合はそれを使用してください。
- アクセシビリティに関するWCAG要件に従ってください。
- コンポーネントのドキュメントを追加してください。
- UIコンポーネントを`/path_to_your_design_system`に配置し、本当に必要な場合を除き、インラインスタイルは使用しないでください。

### コンポーネント追加フロー

1. `components/` 配下にディレクトリを作成し、`Component.tsx` を用意（スタイルは Tailwind ユーティリティで記述）
2. 必要に応じて `README.md` を追加（API・アクセシビリティ・依存関係を明記）
3. `components/index.ts` にエクスポートを追加
4. lint (`npm run lint --workspace @stamper/frontend`) と build を実行

## スタイルガイド

- **Tailwind ベース**: スタイルは Tailwind ユーティリティで構築します。必要に応じて `clsx` などで条件分岐を行います。
- **トークン優先**: `tailwind.config.ts` で `tokens.css` を参照するよう拡張済みです。色や余白は可能な限りトークンエイリアス (`text-text-primary` など) を利用してください。
- **レイアウト**: Flex / Grid の設定値にもトークン化された値や Tailwind のスケールを活用し、一貫したリズムを維持します。

## アクセシビリティ

- **ARIA/role**: インタラクティブ要素には適切なラベル (`aria-*`, `htmlFor`) を付与
- **フォーカス管理**: `:focus-visible` 用トークン `--outline-focus` を利用
- **コントラスト**: トークン設計は WCAG AA を満たす想定です。新規色を導入する際はコントラスト比を確認してください。

## テストとビルド

```bash
# Lint / 型チェック
npm run lint --workspace @stamper/frontend

# 本番ビルド
npm run build --workspace @stamper/frontend
```

CI 前提で品質を担保するため、開発中もビルドを実行して早期に不整合を検出してください。

## よくあるタスク

### 新しいページを追加したい

1. `app/` 配下にディレクトリを作成（例: `app/dashboard/page.tsx`）
2. ページがインタラクティブな場合は先頭に `"use client"`
3. Design System コンポーネントでレイアウトを構築し、必要なら Design Tokens を拡張

### ログイン画面の文言/挙動を調整したい

- 文言: `app/page.tsx` または `path_to_your_design_system/components/LoginPanel/LoginPanel.tsx`
- バリデーション: `LoginPanel` 内の state やハンドラを更新
- 補助リンク/CTA: `LoginPanel` の JSX を編集し、アクセシビリティ属性の整合を確認

### デザインカンプを取り込む場合

1. Figma Dev Mode でカラー・タイポグラフィ・スペーシングを確認
2. 既存トークンで再現できるかを確認し、足りなければ `tokens.css` に追記
3. 新規コンポーネントが必要な場合は前述のフローで追加

---

質問や提案事項は Issue / PR で共有し、知見はこのドキュメントに随時反映してください。
