## ADDED Requirements

### Requirement: Health check endpoint — SHALL/MUST provide health check endpoint
The system SHALL provide a health check endpoint that returns HTTP 200 when the service is available.
バックエンドは稼働確認のためのヘルスチェックエンドポイントを提供しなければならない。

#### Scenario: Health OK
- **WHEN** クライアントがヘルスチェックエンドポイントに GET リクエストする
- **THEN** ステータス 200 を返す（レスポンスボディは空でも可）

