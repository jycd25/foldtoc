import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const MARKDOWN = /\.(?:md|markdown|mdx)$/i
const IGNORED_DIRS = new Set(['.git', 'node_modules'])

export class UsageError extends Error {
  name = 'UsageError'
}

/**
 * Turns the paths given on the command line into absolute file paths.
 * Paths may be bare names, relative (to `cwd`) or absolute. Files are used as
 * given; directories are searched recursively for markdown files.
 */
export async function collectFiles(inputs, cwd) {
  const files = []
  for (const input of inputs) {
    const { target, info } = await locate(input, cwd)
    if (info.isDirectory()) await walk(target, files)
    else files.push(target)
  }
  return [...new Set(files)]
}

/** Like collectFiles for one path, which must be a file rather than a directory. */
export async function resolveFile(input, cwd) {
  const { target, info } = await locate(input, cwd)
  if (info.isDirectory()) throw new UsageError(`${input} is a directory; give a single file`)
  return target
}

async function locate(input, cwd) {
  const target = path.resolve(cwd, input)
  const info = await stat(target).catch(() => null)
  if (!info) throw new UsageError(`${input}: no such file or directory (looked for ${target})`)
  return { target, info }
}

async function walk(dir, files) {
  const entries = await readdir(dir, { withFileTypes: true })
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) await walk(full, files)
    } else if (entry.isFile() && MARKDOWN.test(entry.name)) {
      files.push(full)
    }
  }
}
