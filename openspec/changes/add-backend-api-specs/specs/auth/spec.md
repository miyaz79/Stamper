## ADDED Requirements

### Requirement: Authentication API (login) — SHALL/MUST provide authentication endpoint
The system SHALL provide an endpoint that accepts email and password and returns a JWT on successful authentication.
バックエンドはメールとパスワードを受け取り、認証に成功した場合に JWT を返すエンドポイントを提供しなければならない。

#### Scenario: Login success
- **WHEN** 正しいメールとパスワードが送信される
- **THEN** ステータス 200 を返し、レスポンスボディに `token`（JWT）と最小の `user` オブジェクトを含む

#### Scenario: Login failure
- **WHEN** 誤った資格情報が送信される
- **THEN** ステータス 401 を返す

