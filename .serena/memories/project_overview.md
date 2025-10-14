# Stamper Overview
- **Goal**: Deliver a PoC for an internal attendance & expense management web app that replaces spreadsheet-based workflows, with accurate tracking, integrated approvals, and strong UX.
- **Scope**: PoC focuses on attendance tracking (F-002〜F-008); expense/OCR and approval flows land post-PoC but stubs exist.
- **Architecture**: Turborepo monorepo hosting a Next.js frontend plus AWS SAM backends (TypeScript + Python) deployed on serverless AWS (Lambda, API Gateway, SQS, Textract, RDS via RDS Proxy, Amplify Hosting, Cognito). Shared types live in `packages/types`.
- **Key Modules**:
  - `apps/frontend`: App Router login screen + design system.
  - `apps/backend-ts`: REST API lambdas with Zod validation (attendance, health check, etc.).
  - `apps/backend-py`: Future OCR worker placeholder.
  - `packages/eslint-config`, `packages/tsconfig`, `packages/types`: shared config and contracts.
- **Docs**: Requirements, screen specs, and architecture write-ups inside `docs/specification/` guide domain rules and UI flows.