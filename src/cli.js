import { readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { UsageError, collectFiles, resolveFile } from './files.js'
import { removeSections } from './sections.js'
import { updateToc } from './toc.js'

const USAGE = `Usage: foldtoc [options] <file or directory>...
       foldtoc rm [options] <file> <section>...

Adds or updates a table of contents whose sub-sections are collapsed behind
<details> toggles. Directories are searched recursively for .md, .markdown and
.mdx files; node_modules and .git are skipped.

"foldtoc rm" deletes whole sections (heading, text and sub-sections) from one
file and updates its TOC. Name a section by its anchor from the TOC
("#heap--priority-queue") or by its heading text ("Heap / Priority Queue").
It lists what it will delete and asks first, unless given --yes.

Options:
  --title <markdown>    Title above the TOC (default: "**Table of Contents**")
  --notitle             No title
  --minlevel <1-6>      Shallowest heading level to include (default: 1)
  --maxlevel <1-6>      Deepest heading level to include (default: 6)
  --all                 Also include headings above the TOC
  -u, --update-only     Only update files that already have a TOC
  --entryprefix <char>  List bullet: -, * or + (default: -)
  --github              GitHub anchors (default)
  --gitlab              GitLab anchors
  -s, --stdout          Print the result instead of writing it (one file only)
  --dryrun              Write nothing; exit with 1 if any file is out of date
  --loglevel <level>    silent, error, warn, info, debug or trace (default: info)
  -h, --help            Show this help
  -v, --version         Show the version

Options for rm:
  -y, --yes             Delete without asking
  The TOC options above (--title, --maxlevel, ...) also apply, so the TOC is
  rebuilt the way you normally generate it.
`

// Options that shape the TOC, shared by both commands.
const TOC_OPTIONS = {
  title: { type: 'string' },
  notitle: { type: 'boolean' },
  minlevel: { type: 'string' },
  maxlevel: { type: 'string' },
  all: { type: 'boolean' },
  entryprefix: { type: 'string' },
  github: { type: 'boolean' },
  gitlab: { type: 'boolean' },
  bitbucket: { type: 'boolean' },
  nodejs: { type: 'boolean' },
  ghost: { type: 'boolean' },
  loglevel: { type: 'string' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
}

const GENERATE_OPTIONS = {
  ...TOC_OPTIONS,
  'update-only': { type: 'boolean', short: 'u' },
  stdout: { type: 'boolean', short: 's' },
  dryrun: { type: 'boolean' },
}

const REMOVE_OPTIONS = {
  ...TOC_OPTIONS,
  yes: { type: 'boolean', short: 'y' },
}

const LOG_LEVELS = ['silent', 'error', 'warn', 'info', 'debug', 'trace']
const ERROR = LOG_LEVELS.indexOf('error')
const INFO = LOG_LEVELS.indexOf('info')

/**
 * Runs the command line and resolves to the exit code: 0 on success, 1 when a
 * file failed or (with --dryrun) is out of date, 2 on bad usage.
 *
 * `confirm(question)` asks the user a yes/no question; leave it out when there
 * is no terminal to ask on.
 */
export async function main(argv, { cwd, stdout, stderr, confirm }) {
  if (!argv.length) {
    stderr.write(USAGE)
    return 2
  }
  const remove = argv[0] === 'rm'

  let args
  let files
  try {
    args = readArgs(remove ? argv.slice(1) : argv, remove ? REMOVE_OPTIONS : GENERATE_OPTIONS)
    if (args.help) {
      stdout.write(USAGE)
      return 0
    }
    if (args.version) {
      stdout.write(`${readVersion()}\n`)
      return 0
    }
    if (remove) {
      files = [await resolveFile(args.paths[0], cwd)]
      if (args.paths.length < 2) throw new UsageError('name at least one section to delete')
      if (!args.yes && !confirm) throw new UsageError('there is no terminal to ask for confirmation; pass --yes to delete')
    } else {
      files = await collectFiles(args.paths, cwd)
      if (args.stdout && files.length !== 1) {
        throw new UsageError(`--stdout works with a single file, but ${files.length} were given`)
      }
    }
  } catch (err) {
    if (err.name !== 'UsageError' && !err.code?.startsWith('ERR_PARSE_ARGS')) throw err
    stderr.write(`foldtoc: ${err.message}\nRun "foldtoc --help" for usage.\n`)
    return 2
  }

  const io = { cwd, stdout, stderr, confirm }
  return remove ? removeCommand(files[0], args.paths.slice(1), args, io) : generateCommand(files, args, io)
}

async function generateCommand(files, args, { cwd, stdout, stderr }) {
  const info = (line) => args.logLevel >= INFO && stdout.write(`${line}\n`)
  let failed = false
  let outOfDate = 0

  for (const file of files) {
    const shown = displayPath(file, cwd)
    try {
      const result = updateToc(await readFile(file, 'utf8'), args.toc)
      if (args.stdout) {
        stdout.write(result.content)
        continue
      }
      let label = result.status
      if (result.status === 'updated') {
        if (args.dryrun) {
          label = 'out of date'
          outOfDate++
        } else {
          await writeFile(file, result.content)
        }
      }
      info(`${label.padEnd(12)}${shown}${result.reason ? ` (${result.reason})` : ''}`)
    } catch (err) {
      failed = true
      if (args.logLevel >= ERROR) stderr.write(`foldtoc: ${shown}: ${err.message}\n`)
    }
  }

  if (outOfDate) info(`${outOfDate} file${outOfDate === 1 ? ' is' : 's are'} out of date`)
  return failed || outOfDate ? 1 : 0
}

async function removeCommand(file, targets, args, { cwd, stdout, stderr, confirm }) {
  const shown = displayPath(file, cwd)
  let result
  try {
    result = removeSections(await readFile(file, 'utf8'), targets, { anchors: args.toc.anchors })
  } catch (err) {
    if (args.logLevel >= ERROR) stderr.write(`foldtoc: ${shown}: ${err.message}\n`)
    return 1
  }

  if (!args.yes) {
    stdout.write(`About to delete from ${shown}:\n`)
    for (const section of result.removed) stdout.write(`  ${describeSection(section)}\n`)
    if (!(await confirm('Delete? [y/N] '))) {
      stdout.write('Nothing deleted.\n')
      return 0
    }
  }

  // Rebuild rather than patch the TOC: deleting a section can renumber the
  // anchors of later headings that share a name ("practice-3" -> "practice-2").
  const updated = updateToc(result.content, { ...args.toc, updateOnly: true })
  await writeFile(file, updated.content)
  if (args.logLevel >= INFO) {
    for (const section of result.removed) stdout.write(`${'deleted'.padEnd(12)}${describeSection(section)}\n`)
    if (updated.status === 'updated') stdout.write(`${'updated'.padEnd(12)}TOC in ${shown}\n`)
  }
  return 0
}

function describeSection({ level, text, firstLine, lastLine, subsections }) {
  const inner = subsections ? `, ${subsections} sub-section${subsections === 1 ? '' : 's'}` : ''
  return `${'#'.repeat(level)} ${text}  (lines ${firstLine}-${lastLine}${inner})`
}

function readArgs(argv, options) {
  const { values, positionals } = parseArgs({ args: argv, options, allowPositionals: true })

  if (values.bitbucket) {
    throw new UsageError("--bitbucket isn't supported: Bitbucket doesn't render HTML in markdown, so the <details> toggles can't work there")
  }
  for (const host of ['nodejs', 'ghost']) {
    if (values[host]) throw new UsageError(`--${host} anchors aren't supported; use --github or --gitlab`)
  }
  if (values.github && values.gitlab) throw new UsageError('pick one of --github and --gitlab')
  if (!values.help && !values.version && !positionals.length) throw new UsageError('no file or directory given')

  const minLevel = readLevel('minlevel', values.minlevel ?? '1')
  const maxLevel = readLevel('maxlevel', values.maxlevel ?? '6')
  if (minLevel > maxLevel) throw new UsageError('--minlevel must not be greater than --maxlevel')

  const entryPrefix = values.entryprefix ?? '-'
  if (!['-', '*', '+'].includes(entryPrefix)) throw new UsageError('--entryprefix must be -, * or +')

  const logLevel = LOG_LEVELS.indexOf(values.loglevel ?? 'info')
  if (logLevel === -1) throw new UsageError(`--loglevel must be one of ${LOG_LEVELS.join(', ')}`)

  return {
    paths: positionals,
    help: values.help,
    version: values.version,
    stdout: values.stdout,
    dryrun: values.dryrun,
    yes: values.yes,
    logLevel,
    toc: {
      anchors: values.gitlab ? 'gitlab' : 'github',
      title: values.notitle ? '' : values.title,
      minLevel,
      maxLevel,
      all: values.all,
      updateOnly: values['update-only'],
      entryPrefix,
    },
  }
}

function readLevel(name, value) {
  if (!/^[1-6]$/.test(value)) throw new UsageError(`--${name} must be a number from 1 to 6`)
  return Number(value)
}

function readVersion() {
  return JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version
}

// Paths under the current directory are shown relative to it; others in full.
function displayPath(file, cwd) {
  const relative = path.relative(cwd, file)
  return relative.startsWith('..') || path.isAbsolute(relative) ? file : relative
}
