import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

/**
 * Regression guard for a silent, hard-to-spot form bug.
 *
 * HTMLFormElement's named getter is [LegacyOverrideBuiltIns], so a form control
 * whose id/name matches a built-in member shadows it on the form object:
 *
 *   <form><input id="nodeName"></form>  =>  form.nodeName is the <input>, not "FORM"
 *
 * React's submit handling calls `node.nodeName.toLowerCase()`. When that is an
 * element instead of a string it throws *before* the onSubmit handler's
 * event.preventDefault() runs, so the browser performs a native GET submit and
 * reloads the page. The mutation never fires and no error is shown — the entry
 * simply never saves. This is what broke the hierarchy admin dialog.
 */
const FORBIDDEN_CONTROL_IDS = new Set([
  // Node / Element members React reads while handling events
  "nodeName",
  "nodeType",
  "nodeValue",
  "tagName",
  "parentNode",
  "firstChild",
  "lastChild",
  "childNodes",
  "ownerDocument",
  "attributes",
  "textContent",
  // HTMLFormElement's own members
  "action",
  "method",
  "target",
  "elements",
  "length",
  "submit",
  "reset",
  "requestSubmit",
  "checkValidity",
  "reportValidity",
  "noValidate",
  "enctype",
  "acceptCharset",
  "autocomplete",
])

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      sourceFiles(full, acc)
    } else if (/\.(tsx|jsx)$/.test(entry)) {
      acc.push(full)
    }
  }
  return acc
}

describe("form controls must not clobber HTMLFormElement members", () => {
  it("no id= or name= on a form control uses a reserved DOM member name", () => {
    const offenders: string[] = []

    for (const file of sourceFiles(join(process.cwd(), "src"))) {
      const source = readFileSync(file, "utf8")
      for (const match of source.matchAll(/\b(?:id|name)="([A-Za-z0-9_-]+)"/g)) {
        if (FORBIDDEN_CONTROL_IDS.has(match[1])) {
          const line = source.slice(0, match.index).split("\n").length
          offenders.push(`${file.replace(process.cwd(), ".")}:${line} — "${match[1]}"`)
        }
      }
    }

    expect(offenders).toEqual([])
  })
})
