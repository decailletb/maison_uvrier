#!/usr/bin/env node
/**
 * PreToolUse hook: cap the output of the verbose commands this repo will run once the
 * 3D viewer code exists, before that output reaches the model's context.
 *
 * It targets the commands this Vite/TypeScript project produces:
 *
 *   npm run build / vite build   lists every transformed module; errors are in the tail
 *   npm test / vitest run        one line per test; failures and the summary are in the tail
 *   tsc (any flags)              one line per type error; a clean run prints nothing
 *   npm run lint / eslint        one line per finding
 *   npm run test:e2e / playwright test   webServer and browser logs; summary in the tail
 *   npm run screenshots          one line per preset
 *
 * Deliberately NOT filtered: npm install, npm run dev, vite (dev server), npx <anything>
 * that is not vitest/tsc. Rewriting a command here also auto-approves it, and those
 * either execute third-party install scripts or stream indefinitely.
 *
 * Works for both the Bash tool (POSIX pipes) and the PowerShell tool.
 */

const KEEP_LINES = 120;

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.stdout.write("{}");
    return;
  }

  const toolName = input.tool_name || "";
  const cmd = (input.tool_input && input.tool_input.command) || "";

  // Already piped or redirected: the caller shaped the output on purpose.
  if (!cmd || /[|><]/.test(cmd)) {
    process.stdout.write("{}");
    return;
  }

  const verbose =
    /(^|[;&\s])npm (run )?(build|test|lint|typecheck|test:e2e|screenshots|assets:fetch)(\s|$)/.test(cmd) ||
    /(^|[;&\s])(npx\s+)?playwright (test|install)(\s|$)/.test(cmd) ||
    /(^|[;&\s])(npx\s+)?vite build(\s|$)/.test(cmd) ||
    /(^|[;&\s])(npx\s+)?vitest( run)?(\s|$)/.test(cmd) ||
    /(^|[;&\s])(npx\s+)?tsc(\s|$)/.test(cmd) ||
    /(^|[;&\s])(npx\s+)?eslint(\s|$)/.test(cmd);

  if (!verbose) {
    process.stdout.write("{}");
    return;
  }

  let rewritten;
  if (toolName === "PowerShell") {
    rewritten = `${cmd} 2>&1 | Select-Object -Last ${KEEP_LINES}`;
  } else if (toolName === "Bash") {
    rewritten = `${cmd} 2>&1 | tail -n ${KEEP_LINES}`;
  } else {
    process.stdout.write("{}");
    return;
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        updatedInput: { ...input.tool_input, command: rewritten },
      },
    })
  );
});
