## ADDED Requirements

### Requirement: Categories list API — SHALL/MUST provide categories list endpoint
The system SHALL provide an endpoint that returns a list of categories as an array of objects with `id` and `name`.
システムはカテゴリ一覧を返すエンドポイントを提供しなければならない。初期実装では認証は不要とする。

#### Scenario: Get categories
- **WHEN** クライアントがカテゴリ一覧エンドポイントに GET リクエストする
- **THEN** ステータス 200 を返し、配列としてカテゴリのリストを返す（各カテゴリは id と name を持つ）

