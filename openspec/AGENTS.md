# OpenSpec 指示書

OpenSpec を使った仕様駆動開発のための AI コーディングアシスタント向け指示集です。

## 要約チェックリスト (TL;DR)

- 既存作業の検索: `openspec spec list --long`, `openspec list`（全文検索が必要な場合は `rg` を使用）
- スコープを決める: 新機能か既存機能の変更か
- 一意の `change-id` を選ぶ: ケバブケース、動詞で始める（`add-`, `update-`, `remove-`, `refactor-`）
- スキャフォールド: `proposal.md`, `tasks.md`, 必要なら `design.md`、影響を受ける能力ごとにデルタ spec を作成
- デルタを書く: `## ADDED|MODIFIED|REMOVED|RENAMED Requirements` を使い、各要件に最低 1 つの `#### Scenario:` を含める
- 検証: `openspec validate [change-id] --strict` を実行し、問題を修正する
- 承認要求: 提案が承認されるまで実装を始めないこと

## 3 段階のワークフロー

### ステージ 1: 変更の作成
提案は次の場合に作成します:
- 機能追加や新しい機能の導入
- 破壊的変更（API、スキーマ）の実施
- アーキテクチャやパターンの変更
- 性能最適化（挙動が変わる場合）
- セキュリティパターンの更新

トリガー例:
- 「変更提案を作成するのを手伝って」
- 「変更計画を手伝って」
- 「提案を作りたい」
- 「スペック提案を作成したい」

ゆるい判定基準:
- 文に `proposal`、`change`、`spec` のいずれかが含まれている
- かつ `create`、`plan`、`make`、`start`、`help` のいずれかが含まれている

提案不要の例:
- バグ修正（意図された振る舞いに戻す場合）
- タイポ、フォーマット、コメントのみの修正
- 非破壊的な依存関係の更新
- 設定ファイルの変更
- 既存の挙動に対するテスト追加

ワークフロー:
1. `openspec/project.md`、`openspec list`、`openspec list --specs` を読み、現在の文脈を把握する
2. 一意の動詞先頭 `change-id` を選び、`openspec/changes/<id>/` に `proposal.md`、`tasks.md`、必要なら `design.md`、そして spec デルタを作成する
3. `## ADDED|MODIFIED|REMOVED Requirements` を使って spec のデルタを作成し、各要件に少なくとも 1 つの `#### Scenario:` を含める
4. `openspec validate <id> --strict` を実行し、問題を解決してから提案を共有する

### ステージ 2: 変更の実装
実装は TODO リストに従って順に完了させます。
1. **proposal.md を読む** - 何を作るか理解する
2. **design.md を読む**（存在する場合）- 技術的決定を確認する
3. **tasks.md を読む** - 実装チェックリストを把握する
4. **タスクを順に実装** - 順序通り実施する
5. **完了確認** - `tasks.md` のすべての項目が完了していることを確認する
6. **チェックリスト更新** - すべて完了したら `- [x]` にして現実と一致させる
7. **承認ゲート** - 提案がレビュー・承認されるまで実装を開始しない

### ステージ 3: 変更のアーカイブ
デプロイ後、別 PR を作って以下を行います:
- `changes/[name]/` を `changes/archive/YYYY-MM-DD-[name]/` に移動
- 能力が変わった場合は `specs/` を更新
- ツールのみの変更の場合は `openspec archive <change-id> --skip-specs --yes` を使用（change ID を明示的に渡すこと）
- `openspec validate --strict` を実行して、アーカイブした変更がチェックを通ることを確認する

## タスク実行前のチェックリスト

**文脈チェックリスト:**
- [ ] `specs/[capability]/spec.md` の関連する spec を読む
- [ ] `changes/` に保留中の変更がないか衝突をチェックする
- [ ] `openspec/project.md` を読み慣習を確認する
- [ ] `openspec list` を実行してアクティブな変更を確認する
- [ ] `openspec list --specs` を実行して既存の能力を確認する

**スペック作成前の注意:**
- 能力が既に存在しないか必ず確認する
- 重複を避けるため既存の spec の変更を優先する
- `openspec show [spec]` を使って現在の状態をレビューする
- 要求が曖昧な場合は、スキャフォールド作成前に 1～2 の確認質問をする

### 検索ガイダンス
- スペック列挙: `openspec spec list --long`（スクリプト用に `--json` も可）
- 変更列挙: `openspec list`（補助的に `openspec change list --json` も可）
- 詳細表示:
  - Spec: `openspec show <spec-id> --type spec`（フィルタ用に `--json` を使用）
  - Change: `openspec show <change-id> --json --deltas-only`
  - 全文検索（ripgrep を使用）: `rg -n "Requirement:|Scenario:" openspec/specs`

## クイックスタート

### CLI コマンド

```bash
# 重要なコマンド
openspec list                  # 進行中の変更を一覧
openspec list --specs          # スペックを一覧
openspec show [item]           # 変更またはスペックを表示
openspec validate [item]       # 変更またはスペックを検証
openspec archive <change-id> [--yes|-y]   # デプロイ後にアーカイブ（非対話モードでは --yes を追加）

# プロジェクト管理
openspec init [path]           # OpenSpec を初期化
openspec update [path]         # 指示ファイルを更新

# 対話モード
openspec show                  # 選択プロンプトを表示
openspec validate              # 一括検証モード

# デバッグ
openspec show [change] --json --deltas-only
openspec validate [change] --strict
```

### コマンドフラグ

- `--json` - 機械可読な出力
- `--type change|spec` - 種類の明示
- `--strict` - 包括的な検証
- `--no-interactive` - プロンプトを無効化
- `--skip-specs` - スペック更新なしでアーカイブ
- `--yes`/`-y` - 確認プロンプトをスキップ（非対話）

## ディレクトリ構成

```
openspec/
├── project.md              # プロジェクト規約
├── specs/                  # 現行の仕様 - 実装されているもの
│   └── [capability]/       # 単一責務の能力ごとのディレクトリ
│       ├── spec.md         # 要件とシナリオ
│       └── design.md       # 技術パターン（任意）
├── changes/                # 提案 - 変更予定のもの
│   ├── [change-name]/
│   │   ├── proposal.md     # なぜ、何を、影響
│   │   ├── tasks.md        # 実装チェックリスト
│   │   ├── design.md       # 技術的決定（任意）
│   │   └── specs/          # デルタ仕様
│   │       └── [capability]/
│   │           └── spec.md # ADDED/MODIFIED/REMOVED
│   └── archive/            # 完了した変更
```

## 変更提案の作成手順

### 決定木

```
新しい要求?
├─ 既存スペックの挙動を復元するバグ修正? → 直接修正
├─ タイポ/フォーマット/コメント? → 直接修正
├─ 新機能/能力? → 提案作成
├─ 破壊的変更? → 提案作成
├─ アーキテクチャ変更? → 提案作成
└─ 不明確? → 提案作成（安全側を取る）
```

### 提案書の構成

1. **ディレクトリ作成:** `changes/[change-id]/`（ケバブケース、動詞で始め、ユニークに）

2. **proposal.md を記述:**
```markdown
## Why
[問題・機会について1～2文]

## What Changes
- [変更点の箇条書き]
- [破壊的変更には **BREAKING** を記載]

## Impact
- 影響を受けるスペック: [能力のリスト]
- 影響を受けるコード: [主要ファイル/システム]
```

3. **spec デルタを作成:** `specs/[capability]/spec.md`
```markdown
## ADDED Requirements
### Requirement: New Feature
The system SHALL provide...

#### Scenario: Success case
- **WHEN** user performs action
- **THEN** expected result
```

複数の能力に影響する場合は、`changes/[change-id]/specs/<capability>/spec.md` 配下に能力ごとのファイルを作成すること—能力ごとに 1 ファイル。

4. **tasks.md を作成:**
```markdown
## 1. Implementation
- [ ] 1.1 Create database schema
- [ ] 1.2 Implement API endpoint
- [ ] 1.3 Add frontend component
- [ ] 1.4 Write tests
```

5. **必要な場合に design.md を作成:**
以下に該当する場合は `design.md` を追加し、それ以外は省略する:
- 横断的な変更（複数サービス/モジュール）や新しいアーキテクチャパターン
- 新しい外部依存や重要なデータモデル変更
- セキュリティ、性能、マイグレーションの複雑さ
- コーディング前に技術的な決定があると好ましい曖昧さがある場合

最小限の `design.md` テンプレート:
```markdown
## Context
[背景、制約、ステークホルダー]

## Goals / Non-Goals
- Goals: [...]
- Non-Goals: [...]

## Decisions
- Decision: [何を、なぜ]
- Alternatives considered: [選択肢と検討理由]

## Risks / Trade-offs
- [リスク] → 緩和策

## Migration Plan
[手順、ロールバック]

## Open Questions
- [...]
```

## スペックファイルのフォーマット

### 重要: シナリオの書式

**正しい例**（#### ヘッダを使用）:
```markdown
#### Scenario: User login success
- **WHEN** valid credentials provided
- **THEN** return JWT token
```

**誤りの例**（箇条書きや太字のみを使わない）:
```markdown
- **Scenario: User login**  ❌
**Scenario**: User login     ❌
### Scenario: User login      ❌
```

すべての要件は最低 1 つのシナリオを持つ必要があります。

### 要件文の書き方
- 規範的要件には SHALL/MUST を使う（意図的に非規範にする場合を除き should/may は避ける）

### デルタ操作の種類

- `## ADDED Requirements` - 新しい能力
- `## MODIFIED Requirements` - 振る舞いの変更
- `## REMOVED Requirements` - 廃止された機能
- `## RENAMED Requirements` - 名称変更

ヘッダは `trim(header)` でマッチさせる（空白を無視）

#### ADDED と MODIFIED の使い分け
- ADDED: 新しい能力や独立して成立するサブ能力を導入する場合。既存要件の意味論を変えるのではなく横断的な追加である場合は ADDED を優先。
- MODIFIED: 既存要件の振る舞い、スコープ、受け入れ基準を変更する場合。更新後の全文（ヘッダ＋すべてのシナリオ）を必ず貼り付けること。アーカイバは提供された内容で既存要件を置き換えるため、部分的なデルタは既存の詳細を失う可能性がある。
- RENAMED: 名前だけを変える場合に使用。振る舞いも変える場合は RENAMED（名前）と MODIFIED（内容）を組み合わせる。

よくある落とし穴: MODIFIED を使って新しい懸念を追加する際に以前のテキストを含めないこと。これはアーカイブ時に情報が失われる原因となる。既存要件を明示的に変更しないのであれば、ADDED に新しい要件を追加する。

MODIFIED 要件を正しく作成する手順:
1) `openspec/specs/<capability>/spec.md` で既存の要件を見つける
2) 要件ブロック全体（`### Requirement: ...` からそのシナリオまで）をコピーする
3) `## MODIFIED Requirements` の下に貼り付け、必要な変更を行う
4) ヘッダテキストが正確に一致することを確認し、最低 1 つの `#### Scenario:` を残す

RENAMED の例:
```markdown
## RENAMED Requirements
- FROM: `### Requirement: Login`
- TO: `### Requirement: User Authentication`
```

## トラブルシューティング

### よくあるエラー

**"Change must have at least one delta"**
- `changes/[name]/specs/` に .md ファイルが存在するか確認する
- ファイルに操作プレフィックス（## ADDED Requirements 等）があるか確認する

**"Requirement must have at least one scenario"**
- シナリオが `#### Scenario:` 形式（# を 4 つ）になっているか確認する
- シナリオヘッダに箇条書きや太字だけを使っていないか確認する

**サイレントなシナリオ解析失敗**
- 正確な書式が必要: `#### Scenario: Name`
- デバッグコマンド: `openspec show [change] --json --deltas-only`

### 検証のヒント

```bash
# 包括的なチェックには常に strict モードを使う
openspec validate [change] --strict

# デルタ解析のデバッグ
openspec show [change] --json | jq '.deltas'

# 特定の要件を確認する
openspec show [spec] --json -r 1
```

## ハッピーパスのスクリプト

```bash
# 1) 現状を調べる
openspec spec list --long
openspec list
# 任意の全文検索:
# rg -n "Requirement:|Scenario:" openspec/specs
# rg -n "^#|Requirement:" openspec/changes

# 2) change id を選びスキャフォールドを作成
CHANGE=add-two-factor-auth
mkdir -p openspec/changes/$CHANGE/{specs/auth}
printf "## Why\n...\n\n## What Changes\n- ...\n\n## Impact\n- ...\n" > openspec/changes/$CHANGE/proposal.md
printf "## 1. Implementation\n- [ ] 1.1 ...\n" > openspec/changes/$CHANGE/tasks.md

# 3) デルタを追加（例）
cat > openspec/changes/$CHANGE/specs/auth/spec.md << 'EOF'
## ADDED Requirements
### Requirement: Two-Factor Authentication
Users MUST provide a second factor during login.

#### Scenario: OTP required
- **WHEN** valid credentials are provided
- **THEN** an OTP challenge is required
EOF

# 4) 検証
openspec validate $CHANGE --strict
```

## 複数能力を跨ぐ例

```
openspec/changes/add-2fa-notify/
├── proposal.md
├── tasks.md
└── specs/
    ├── auth/
    │   └── spec.md   # ADDED: Two-Factor Authentication
    └── notifications/
        └── spec.md   # ADDED: OTP email notification
```

auth/spec.md
```markdown
## ADDED Requirements
### Requirement: Two-Factor Authentication
...
```

notifications/spec.md
```markdown
## ADDED Requirements
### Requirement: OTP Email Notification
...
```

## ベストプラクティス

### シンプルさを最優先
- 新規コードは原則 100 行未満を目安に
- 十分な理由が出るまでは単一ファイル実装を優先
- 明確な根拠がない限り不要なフレームワークは避ける
- 実績のある定石パターンを選ぶ

### 複雑化のトリガー
複雑さを追加するのは以下の条件がある場合のみ:
- 現行ソリューションが遅すぎるという性能データがある
- 具体的なスケール要件（>1000 ユーザー、>100MB データなど）がある
- 抽象化が必要な複数の実用ケースが存在する

### 明確な参照方法
- コード位置は `file.ts:42` 形式を使う
- スペック参照は `specs/auth/spec.md` のように表記
- 関連する変更や PR をリンクする

## 能力名の付け方
- 動詞-名詞形式: `user-auth`, `payment-capture`
- 能力は単一責務にする
- 10 分で理解できる説明を目安に
- 説明に "AND" が必要な場合は分割を検討

## change ID の命名
- 短く説明的なケバブケースを使う: `add-two-factor-auth`
- 動詞先頭プレフィックスを推奨: `add-`, `update-`, `remove-`, `refactor-`
- 既に使われている場合は `-2`, `-3` などを追加して一意にする

## ツール選択ガイド

| Task | Tool | Why |
|------|------|-----|
| Find files by pattern | Glob | 高速なパターンマッチング |
| Search code content | Grep | 正規表現による高速検索 |
| Read specific files | Read | 直接ファイルを読む |
| Explore unknown scope | Task | 複数手順の調査に便利 |

## エラー復旧

### 変更の衝突
1. `openspec list` を実行してアクティブな変更を確認
2. 重複するスペックがないか確認
3. 変更所有者と調整する
4. 提案を統合することを検討する

### 検証失敗
1. `--strict` フラグで再実行
2. JSON 出力をチェックして詳細を確認
3. スペックファイル形式を確認
4. シナリオが正しくフォーマットされているか確認

### コンテキスト不足
1. まず `project.md` を読む
2. 関連するスペックを確認
3. 最近のアーカイブをレビュー
4. 不明点は確認の質問をする

## クイックリファレンス

### ステージインジケータ
- `changes/` - 提案中、未実装
- `specs/` - 実装済み・デプロイ済み
- `archive/` - 完了済みの変更

### ファイルの目的
- `proposal.md` - なぜ／何を変更するか
- `tasks.md` - 実装ステップ
- `design.md` - 技術的決定（必要な場合）
- `spec.md` - 要件と振る舞い

### CLI の必須コマンド
```bash
openspec list              # 現在何が進行中か
openspec show [item]       # 詳細を表示
openspec validate --strict # 正しいか検証
openspec archive <change-id> [--yes|-y]  # 完了としてマーク（自動化では --yes を付ける）
```

覚えておくこと: スペックが事実（truth）です。変更は提案です。両者を常に同期させてください。
