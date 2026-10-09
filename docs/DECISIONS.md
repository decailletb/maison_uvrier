# Decisions

One line per decision, newest last. Decisions listed in `docs/PROMPT.md` are final and
not repeated here.

| Date | Decision | Reasoning |
|---|---|---|
| 2026-10-09 | Phase plans are written as checklists directly, without the interactive plan mode | Sessions run unattended; plan mode would block on approval nobody can give. |
| 2026-10-09 | TypeScript pinned to 5.9.x, ESLint 9.x | TypeScript 7 / ESLint 10 are too new for typescript-eslint and the React plugins. |
| 2026-10-09 | Camera presets selected through the URL query `?preset=<name>` | Lets Playwright screenshot a preset with no UI automation. |
| 2026-10-09 | Three.js units are metres; all house data is in centimetres and converted at scene build time | Three/R3F lighting and physics defaults assume metres; plans are dimensioned in cm. |
