# Task Wrap-Up Checklist
- Ensure unit of work compiles and passes lint via `npm run lint` (or workspace-scoped lint/build commands as appropriate).
- Run relevant builds/tests (`npm run build --workspace ...`, SAM `sam build`, etc.) when backend/front changes are involved.
- Update docs (READMEs/spec) alongside feature changes when behavior/UI shifts.
- Prepare commits following Conventional Commit style (per repo convention) and include only related changes.
- Surface manual verification notes (e.g., login flow, API smoke tests) in PR descriptions for transparency.