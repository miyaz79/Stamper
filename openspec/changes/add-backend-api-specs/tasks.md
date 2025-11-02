## Implementation tasks

1. Preparation
   - [x] 1.1 環境確認: `apps/backend-ts` の既存ハンドラと `lib` をレビューする
   - [x] 1.2 change-id フォルダを作成（完了済）

2. Spec 作成
   - [x] 2.1 `auth`, `categories`, `health` の spec を追加（ADDED Requirements）

3. 実装（小さな PR に分割）
   - [x] 3.1 `health` ハンドラが 200 を返すことを確認するテストを追加し、実装する
   - [x] 3.2 `auth` のログインエンドポイント（メール/パスワード受け取り、JWT 発行）を実装し、ユニットテストを追加する
   - [x] 3.3 `categories` の一覧取得エンドポイント（認証不要で最小実装）を実装し、統合テストを追加する

4. 検証とドキュメント
   - [x] 4.1 `openspec validate add-backend-api-specs --strict` を実行して検証（存在すれば）
   - [ ] 4.2 変更提案を PR として提出し、レビューを受ける

Validation:
- それぞれの要件は少なくとも 1 つの `#### Scenario:` を持つこと
- 実装はテストで検証されること（最低限のユニット/統合）
