# Working method - maison_uvrier

How to run Claude Code sessions on this repo cheaply without losing quality.
Written for a Max plan. The repo holds plans and photos today; a 3D decoration viewer
is the next step.

## Which model to start on

| Task | Start on |
|---|---|
| "What is on page 4", "which photo shows the kitchen" | Any model, but ask through the `plans-reader` agent (Sonnet) or the `house-plans` skill; never open the PDF in the main thread |
| Writing decoration notes, lists, comparisons | **Sonnet** |
| Choosing the 3D stack, data format for rooms and furniture, scene architecture | **Opus** or Fable, in plan mode |
| Adding a component, a material, a UI control once the stack exists | **Sonnet** |
| Debugging a render that looks wrong and you cannot explain | **Opus** |
| Renames, moving files, mechanical edits | **Sonnet** at low effort |

Switch mid-session with `/model`. Switching does not reset context. Start cheap and
escalate when something is hard; drop back down once the hard decision is made.

## /clear vs /compact vs keep going

- **`/clear` is free.** It starts a new session and sends nothing. Use it whenever you
  switch between unrelated work: plan questions, then viewer code, then decoration
  notes. `/rename` first if you might want to `/resume` it.
- **`/compact` is an expensive request.** It reads the whole conversation to summarise
  it. Use it only mid-way through a multi-file change you are not finished with. If you
  would be equally happy starting over, `/clear` instead.
- **Keep going** while you are on the same task and the status line bar is green. It
  turns yellow at 60% and red at 80%; red is the cue to finish the thought and clear.

`CLAUDE.md` ends with compact instructions for this project: keep extracted room names,
dimensions and page numbers, drop image contents already summarised as text.

## Cache behaviour

Claude Code re-sends the whole conversation on every request, at the cached token rate.
A one-line question in a session open all day still draws usage for the entire history.

On Max the prompt cache lives **one hour**. The first message after a longer gap misses
the cache and reprocesses everything at full rate. The lifetime drops to **five
minutes** once you are drawing on usage credits.

Habit for this repo: **work in bounded blocks and `/clear` when you walk away.** Images
make this worse here. A session where you opened four plan pages carries ~6k image
tokens on every later turn, and a cold cache after lunch reprocesses all of them.
Do not leave a session idle overnight and resume it.

The status line shows context percentage, token count and session cost continuously.
Watch the bar rather than discovering the cost afterwards in `/usage`.

## Effort

Extended thinking is on by default and **thinking tokens bill as output tokens**. On
Fable and the 5.5 models thinking cannot be turned off, only lowered.

Lower it with `/effort` for mechanical passes: captioning, renaming, reformatting notes,
adding a material to an existing list. Raise it back for stack choice, scene geometry,
anything you would want a second opinion on.

## Delegating to subagents

Three agents are defined in `.claude/agents/`, each pinned to a model:

| Agent | Model | Use it for |
|---|---|---|
| `plans-reader` | sonnet | Looking at one plan page or photo and returning text. Vision needs judgment, hence Sonnet, not Haiku |
| `Explore` | haiku | "Where is X" across the viewer code, once it exists |
| `build-check` | haiku | `npm run build`, `tsc`, `vitest`; reports only failures |

The biggest saving in this repo is **never opening an image in the main thread**. Each
plan page is ~1.5k tokens and stays in context for the rest of the session. Ask
`plans-reader` instead; its answer is a few hundred tokens and the image dies with the
agent. The `house-plans` skill already holds a page-by-page index and photo captions, so
most questions need no image at all.

Keep in the main thread anything that **needs your approval mid-task**. A subagent
cannot stop and ask a question, so do not delegate: editing code, choosing the stack,
`git push`, anything irreversible.

Several independent agents can run in one turn: "describe page 3" and "describe photos
5503 and 5504" at the same time.

## Prompt hygiene

- **Name the page or the photo.** "What are the dimensions of the room top-left on page
  3" reads one page. "Tell me about the house" reads nine.
- **Use plan mode (Shift+Tab) before anything large.** The 3D viewer stack, the data
  model for rooms and furniture, any refactor. The plan is cheap; forty tool calls in the
  wrong direction are not.
- **Press Escape the moment it goes wrong.** `/rewind` or double-Escape restores both
  conversation and files.
- **Give it a target.** A screenshot of the expected render, a page number, a room name
  as printed on the plan.
- **Ask for the skill when you know you need it.** `house-plans` for anything about
  rooms, dimensions or photos. One call instead of a vision pass.

## This project specifically

- `Plans.pdf` has no text layer except one line on page 2. `pdftotext` and friends
  return nothing useful; the `house-plans` skill is the text version.
- Claude's `Read` tool needs `pdftoppm` to render PDF pages. Poppler 26.09.0 lives in
  `C:\repos\pdftoppm` and its `Library\bin` is on the user PATH (added 2026-10-09).
  PyMuPDF is installed globally as the fallback `plans-reader` uses if that ever breaks.
- Plugins for Power BI, story-forge and this audit are disabled in
  `.claude/settings.json` for this repo only. `typescript-lsp` stays on for the viewer
  code. `avoid-ai-writing` stays on for French prose.
- `.claude/settings.json` denies reads of `.git/`, `node_modules/`, `dist/`, lockfiles
  and 3D asset files (`.glb`, `.gltf`, `.hdr`, `.fbx`, `.obj`). The plans and photos are
  deliberately not denied; they are the content.
- There are no tests, no build and no CI yet. The `build-check` agent and the output
  filter hook are in place for when `package.json` appears.
