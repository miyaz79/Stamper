# Useful Commands
- `npm install`: Install root dependencies across the Turborepo workspaces.
- `npm run dev`: Run Turbo-powered dev servers for all apps (frontend + backends).
- `npx turbo run dev --filter=@stamper/frontend`: Start only the Next.js frontend in dev mode.
- `npm run lint`: Run lint across all workspaces (Turbo orchestrated).
- `npm run build`: Build every workspace; individual builds via `npm run build --workspace <pkg>` (e.g., `@stamper/frontend`).
- `npm run lint --workspace @stamper/frontend`: Lint only the frontend (similar pattern for other workspaces).
- `cd apps/backend-ts && sam build` / `sam deploy`: Build/deploy the TypeScript Lambda stack.
- `cd apps/backend-py && sam build` / `sam deploy`: Build/deploy the Python Lambda stack.