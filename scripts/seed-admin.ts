#!/usr/bin/env bun
/**
 * Seed a `system_admin` user directly into the D1 database.
 *
 * Bootstrap-only tool: it creates the first administrator so the remaining
 * staff accounts can be created from /dashboard/admin-users. It writes the
 * `user` + `account` rows itself rather than going through Better Auth's
 * signUpEmail, so the account is created pre-verified (`email_verified = 1`) —
 * auth.ts sets `requireEmailVerification: true`, which would otherwise lock out
 * the very account being seeded.
 *
 * Usage:
 *   bun run seed:admin              # local D1 (miniflare) — safe default
 *   bun run seed:admin --remote     # PRODUCTION D1, asks for confirmation
 *
 * The password is read with echo suppressed and is only ever written to a temp
 * .sql file as a PBKDF2 hash, which is deleted before the script exits.
 */

import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { hashPassword } from "../src/lib/password"

// Matches d1_databases[0].database_name in wrangler.jsonc. There are no
// wrangler environments — this single database *is* production.
const DB_NAME = "kofdyc-portal"
const ROLE = "system_admin"
const MIN_PASSWORD = 8
const MAX_PASSWORD = 128
// Same rule the login form applies (src/routes/dashboard/login.tsx).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Keycodes handled by the stdin line reader.
const CR = 0x0d
const LF = 0x0a
const CTRL_C = 0x03
const BACKSPACE = 0x08
const DEL = 0x7f

// ---------------------------------------------------------------- prompts
//
// Both prompts share one low-level reader rather than creating a readline
// interface per question: closing a readline interface mid-script discards
// buffered input, which made a non-interactive run exit silently instead of
// reporting an error. Reading stdin directly also makes masking trivial.

const stdin = process.stdin
let stdinStarted = false
let stdinBuffer = ""
let lastWasCR = false
type Waiter = { mask: boolean; resolve: (line: string) => void; reject: (err: Error) => void }
let waiter: Waiter | null = null
let stdinEnded = false
// Completed lines that arrived before a reader asked for them. A pipe can
// deliver every answer in one chunk, so they must be queued rather than
// dropped.
const pendingLines: string[] = []

function startStdin() {
  if (stdinStarted) return
  stdinStarted = true
  if (stdin.isTTY) stdin.setRawMode(true)
  stdin.setEncoding("utf8")
  stdin.resume()
  stdin.on("data", onStdinData)
  stdin.on("end", onStdinEnd)
}

function stopStdin() {
  if (!stdinStarted) return
  stdinStarted = false
  stdin.removeListener("data", onStdinData)
  stdin.removeListener("end", onStdinEnd)
  if (stdin.isTTY) stdin.setRawMode(false)
  stdin.pause()
}

function onStdinEnd() {
  stdinEnded = true
  if (waiter) {
    const w = waiter
    waiter = null
    // Reject rather than resolving with a partial value: a truncated answer
    // must never be treated as a valid name/email/password.
    w.reject(new Error("stdin closed before the prompt was answered."))
  }
}

function onStdinData(chunk: string) {
  for (const ch of chunk) {
    const code = ch.charCodeAt(0)

    if (code === CTRL_C) {
      stopStdin()
      process.stdout.write("\n")
      process.exit(130)
    }

    // Enter is CR on a TTY and LF from a pipe; a CRLF pair must count once.
    if (code === CR || code === LF) {
      if (code === LF && lastWasCR) {
        lastWasCR = false
        continue
      }
      lastWasCR = code === CR
      const line = stdinBuffer
      stdinBuffer = ""
      if (waiter) {
        const w = waiter
        waiter = null
        if (stdin.isTTY) process.stdout.write("\n")
        w.resolve(line)
      } else {
        pendingLines.push(line)
      }
      continue
    }
    lastWasCR = false

    if (code === DEL || code === BACKSPACE) {
      if (stdinBuffer.length > 0) {
        stdinBuffer = stdinBuffer.slice(0, -1)
        if (stdin.isTTY) process.stdout.write("\b \b")
      }
      continue
    }

    // Ignore other control characters (arrow keys, escape sequences).
    if (code < 0x20) continue

    stdinBuffer += ch
    if (stdin.isTTY) process.stdout.write(waiter?.mask ? "*" : ch)
  }
}

/** Reads one line. `mask` hides it behind asterisks (TTY only). */
function readLine(prompt: string, mask = false): Promise<string> {
  if (mask && !stdin.isTTY) {
    return Promise.reject(
      new Error(
        "Refusing to read a password from non-interactive input.\n" +
          "  Run this from an interactive terminal so it can be typed without echo."
      )
    )
  }
  process.stdout.write(prompt)

  // Already-buffered line (piped input) — take it without touching the stream.
  const queued = pendingLines.shift()
  if (queued !== undefined) {
    if (!stdin.isTTY) process.stdout.write(`${queued}\n`)
    return Promise.resolve(queued)
  }

  if (stdinEnded) {
    return Promise.reject(new Error("stdin closed before the prompt was answered."))
  }

  startStdin()
  return new Promise<string>((resolve, reject) => {
    waiter = { mask, resolve, reject }
  })
}

const ask = (prompt: string) => readLine(prompt).then((v) => v.trim())
const askHidden = (prompt: string) => readLine(prompt, true)

async function confirm(question: string): Promise<boolean> {
  const answer = (await ask(`${question} [y/N] `)).toLowerCase()
  return answer === "y" || answer === "yes"
}

function fail(message: string): never {
  console.error(`\n✖ ${message}`)
  process.exit(1)
}

// ---------------------------------------------------------------- wrangler

/**
 * Runs wrangler with no shell, invoking its JS entrypoint directly. Passing
 * argv straight through means SQL never goes past a shell, so quoting rules
 * (cmd.exe vs sh) can't corrupt or reinterpret a statement.
 */
function runWrangler(args: string[]) {
  const entry = fileURLToPath(import.meta.resolve("wrangler/bin/wrangler.js"))
  return spawnSync(process.execPath, [entry, ...args], {
    encoding: "utf8",
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  })
}

/**
 * Runs a SELECT and returns its rows.
 *
 * Must use --command, not --file: with --remote, `d1 execute --file --json`
 * returns a statistics summary ("Total queries executed", "Rows read", …)
 * instead of the query rows, which would make any probe look like a hit.
 */
export function querySql(statement: string, target: string) {
  return runWrangler(["d1", "execute", DB_NAME, target, "--yes", "--json", "--command", statement])
}

/** Applies a .sql file (writes only — no rows expected back). */
export function execSqlFile(file: string, target: string) {
  return runWrangler(["d1", "execute", DB_NAME, target, "--yes", `--file=${file}`])
}

/** wrangler --json prints an array of result sets; a banner may precede it. */
export function parseResults<T>(stdout: string): T[] {
  const start = stdout.indexOf("[")
  const end = stdout.lastIndexOf("]")
  if (start === -1 || end === -1) return []
  try {
    const parsed = JSON.parse(stdout.slice(start, end + 1))
    return parsed?.[0]?.results ?? []
  } catch {
    return []
  }
}

/** Escapes a SQL string literal (single quotes doubled). */
function sql(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

// ---------------------------------------------------------------- sql builder

export interface ExistingUser {
  user_id: unknown
  role?: unknown
  /** id of the existing `credential` account row, if any. */
  account_id?: unknown
}

/**
 * Builds the statements for either branch:
 *  - `existing` absent → insert a new user + credential account
 *  - `existing` present → reset that account's password and promote the user
 *
 * Exported so the write path is testable without driving the prompts.
 */
export function buildStatements(opts: {
  name: string
  email: string
  hash: string
  existing?: ExistingUser
  newId?: () => string
}): string[] {
  const { name, email, hash, existing } = opts
  const newId = opts.newId ?? (() => crypto.randomUUID())
  const statements: string[] = []

  if (existing) {
    const userId = String(existing.user_id)
    if (existing.account_id) {
      statements.push(
        `UPDATE account SET password = ${sql(hash)}, updated_at = unixepoch() WHERE id = ${sql(String(existing.account_id))};`
      )
    } else {
      // No credential account (e.g. the row predates email/password login).
      statements.push(
        `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
 VALUES (${sql(newId())}, ${sql(userId)}, 'credential', ${sql(userId)}, ${sql(hash)}, unixepoch(), unixepoch());`
      )
    }
    statements.push(
      `UPDATE user SET name = ${sql(name)}, role = ${sql(ROLE)}, email_verified = 1, is_active = 1, banned = 0, updated_at = unixepoch() WHERE id = ${sql(userId)};`
    )
  } else {
    const userId = newId()
    statements.push(
      `INSERT INTO user (id, name, email, email_verified, created_at, updated_at, role, is_active, banned)
 VALUES (${sql(userId)}, ${sql(name)}, ${sql(email)}, 1, unixepoch(), unixepoch(), ${sql(ROLE)}, 1, 0);`
    )
    statements.push(
      `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
 VALUES (${sql(newId())}, ${sql(userId)}, 'credential', ${sql(userId)}, ${sql(hash)}, unixepoch(), unixepoch());`
    )
  }

  return statements
}

/** SQL for the pre-flight lookup of an email. */
export function buildProbeSql(email: string): string {
  return `SELECT u.id AS user_id,
        u.role AS role,
        (SELECT a.id FROM account a WHERE a.user_id = u.id AND a.provider_id = 'credential' LIMIT 1) AS account_id
 FROM user u WHERE u.email = ${sql(email)};\n`
}

// ---------------------------------------------------------------- main

async function main() {
  const argv = process.argv.slice(2)

  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(`
Seed a ${ROLE} user into the ${DB_NAME} D1 database.

  bun run seed:admin              local D1 (default)
  bun run seed:admin --remote     PRODUCTION D1

If the email already exists, you'll be offered a password reset +
promotion to ${ROLE} instead — which is also the lockout recovery path.
`)
    process.exit(0)
  }

  // Reject unknown flags — a typo like `--remot` must not silently fall back to
  // the local database when production was intended.
  const unknown = argv.filter((a) => a !== "--remote" && a !== "--local")
  if (unknown.length > 0) {
    fail(`Unknown argument(s): ${unknown.join(", ")}\n  Run with --help for usage.`)
  }

  const remote = argv.includes("--remote")
  const target = remote ? "--remote" : "--local"
  const label = remote ? `PRODUCTION — ${DB_NAME} (remote)` : `local — ${DB_NAME} (miniflare)`

  console.log(`\nTarget database: ${label}`)
  if (!remote) {
    console.log("(pass --remote to target production)")
  }
  console.log("")

  // --- collect credentials

  let name = ""
  while (!name) {
    name = await ask("Name:      ")
    if (!name) console.log("  Name is required.")
  }

  let email = ""
  while (!email) {
    const input = (await ask("Email:     ")).toLowerCase()
    if (!EMAIL_RE.test(input)) {
      console.log("  Enter a valid email address.")
      continue
    }
    email = input
  }

  const tmpDir = mkdtempSync(join(tmpdir(), "kofdyc-seed-"))

  try {
    // --- pre-flight: does the table exist, and is this email taken?
    // Done before asking for a password so schema/target problems surface first.

    const probe = querySql(buildProbeSql(email), target)
    if (probe.status !== 0) {
      const output = `${probe.stderr ?? ""}${probe.stdout ?? ""}`
      if (/no such table/i.test(output)) {
        fail(
          `The \`user\` table does not exist in the ${remote ? "remote" : "local"} database.\n` +
            `  Apply the schema first:\n` +
            (remote
              ? `    wrangler d1 migrations apply ${DB_NAME} --remote\n`
              : `    bun run migrate:local\n`)
        )
      }
      fail(`wrangler failed:\n${output.trim()}`)
    }

    const rows = parseResults<ExistingUser>(probe.stdout ?? "")
    const candidate = rows[0]

    // Only treat this as an existing user if the row really carries a user id.
    // Guards against wrangler returning a summary object rather than rows —
    // silently mistaking that for a hit would target UPDATEs at id 'undefined'
    // and report success while changing nothing.
    let existing: ExistingUser | undefined
    if (candidate !== undefined) {
      if (typeof candidate.user_id === "string" && candidate.user_id.length > 0) {
        existing = candidate
      } else {
        fail(
          `Unexpected response from wrangler while looking up ${email}.\n` +
            `  Expected user rows, got: ${JSON.stringify(candidate)}\n` +
            `  Refusing to continue rather than risk writing to the wrong row.`
        )
      }
    }

    // --- confirm before touching production

    console.log("")
    console.log(`  Database: ${label}`)
    console.log(`  Name:     ${name}`)
    console.log(`  Email:    ${email}`)
    console.log(`  Role:     ${ROLE}`)
    console.log(`  Action:   ${existing ? "reset password + promote (email already exists)" : "create new user"}`)
    console.log("")

    if (existing) {
      console.log(`This email already exists (current role: ${existing.role}).`)
      if (!(await confirm(`Reset its password and promote it to ${ROLE} on ${remote ? "PRODUCTION" : "local"}?`))) {
        console.log("Aborted. No changes made.")
        process.exit(0)
      }
    } else if (remote) {
      if (!(await confirm("Write this user to PRODUCTION?"))) {
        console.log("Aborted. No changes made.")
        process.exit(0)
      }
    }

    // --- collect the password, then hash and build the write

    let password = ""
    while (!password) {
      const first = await askHidden("Password:  ")
      if (first.length < MIN_PASSWORD || first.length > MAX_PASSWORD) {
        console.log(`  Password must be ${MIN_PASSWORD}-${MAX_PASSWORD} characters.`)
        continue
      }
      const second = await askHidden("Confirm:   ")
      if (first !== second) {
        console.log("  Passwords did not match.")
        continue
      }
      if (first.length < 12) {
        console.log("  ⚠ Under 12 characters — consider something longer for a production admin.")
      }
      password = first
    }

    const hash = await hashPassword(password)
    password = ""

    const statements = buildStatements({ name, email, hash, existing })

    const writeFile = join(tmpDir, "seed.sql")
    writeFileSync(writeFile, statements.join("\n\n") + "\n")

    console.log(`\n→ hashing (pbkdf2:100000)`)
    console.log(`→ wrangler d1 execute ${DB_NAME} ${target}`)

    const write = execSqlFile(writeFile, target)
    if (write.status !== 0) {
      fail(`wrangler failed:\n${`${write.stderr ?? ""}${write.stdout ?? ""}`.trim()}`)
    }

    console.log(`\n✔ ${existing ? "Updated" : "Created"} ${email} as ${ROLE} (email_verified = 1)`)
    console.log(`  Sign in at ${remote ? "https://admin.kofdyc.org/dashboard/login" : "http://localhost:3000/dashboard/login"}`)
    console.log(`  No verification email was sent — the account is pre-verified.`)
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}

// Only run when executed directly, so the exported SQL builders can be imported
// and tested without triggering the prompts.
if (import.meta.main) {
  main().catch((error: unknown) => {
    fail(error instanceof Error ? error.message : String(error))
  })
}
