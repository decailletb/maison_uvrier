---
name: checkpoint
description: Run the session checkpoint routine of docs/PROMPT.md section 4 - refresh docs/STATE.md (French, under 80 lines, fixed sections), tick the phase plan, commit and push the current branch. Invoke after every completed sub-step, before long operations, every 30 minutes, or by hand with /checkpoint.
user-invocable: true
---

# Checkpoint

Goal: leave the repo so that the next session needs only the word `continue`.

1. `date`, `git status --short`, `git branch --show-current`, `git log --oneline -3`.
2. If the tree has unfinished work that does not build, finish the smallest coherent
   piece or stash nothing: never commit a broken tree. Run `tsc` and `lint` through the
   `build-check` agent if code changed.
3. Tick finished items in `docs/plan/NN-<phase>.md`.
4. Rewrite `docs/STATE.md` in French, under 80 lines, sections in this exact order:

   ```
   # État du projet — mis à jour <ISO date time>
   ## Phase en cours
   ## Fait (dernières étapes, 5 max)
   ## En cours (étape exacte, fichier, ce qui reste)
   ## Prochaine étape (une ligne : la première action de la prochaine session)
   ## Bloqué / questions pour Benjamin
   ## Branche active, dernier commit, PR ouverte
   ```

   "Prochaine étape" must be a concrete first action (file to open, command to run),
   not a goal. Failing tests are listed as failing, skipped steps as skipped.
5. Commit: `type(scope): summary` (Angular types, no AI attribution, no Co-Authored-By),
   including STATE.md and the plan file with the work they describe.
6. `git push` (set upstream on first push). Never force-push.
7. Reply with one line: branch, commit hash, next step.
