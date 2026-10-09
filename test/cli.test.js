import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const bin = fileURLToPath(new URL('../bin/foldtoc.js', import.meta.url))

function run(args, cwd) {
  const { status, stdout, stderr } = spawnSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8' })
  return { status, stdout, stderr }
}

function project(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'foldtoc-cli-'))
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    writeFileSync(path.join(root, file), content)
  }
  return root
}

const read = (root, file) => readFileSync(path.join(root, file), 'utf8')
const hasToc = (text) => text.includes('<!-- START foldtoc -->')

test('updates a file given by bare name, relative path or absolute path', () => {
  const root = project({ 'a.md': '# A\n', 'sub/b.md': '# B\n', 'c.md': '# C\n' })
  const { status, stdout } = run(['a.md', 'sub/b.md', path.join(root, 'c.md')], root)
  assert.equal(status, 0)
  assert.ok(hasToc(read(root, 'a.md')) && hasToc(read(root, 'sub/b.md')) && hasToc(read(root, 'c.md')))
  assert.match(stdout, /updated\s+a\.md/)
  assert.match(stdout, /updated\s+sub\/b\.md/)
})

test('"." processes every markdown file below the current directory', () => {
  const root = project({ 'README.md': '# R\n', 'docs/x.md': '# X\n', 'node_modules/m/README.md': '# M\n' })
  assert.equal(run(['.'], root).status, 0)
  assert.ok(hasToc(read(root, 'README.md')))
  assert.ok(hasToc(read(root, 'docs/x.md')))
  assert.ok(!hasToc(read(root, 'node_modules/m/README.md')))
  assert.match(run(['.'], root).stdout, /unchanged\s+README\.md/)
})

test('--dryrun reports out-of-date files with exit code 1 and writes nothing', () => {
  const root = project({ 'a.md': '# A\n' })
  const { status, stdout } = run(['--dryrun', 'a.md'], root)
  assert.equal(status, 1)
  assert.match(stdout, /out of date\s+a\.md/)
  assert.equal(read(root, 'a.md'), '# A\n')
  run(['a.md'], root)
  assert.equal(run(['--dryrun', 'a.md'], root).status, 0)
})

test('--stdout prints the result instead of writing it', () => {
  const root = project({ 'a.md': '# A\n' })
  const { status, stdout } = run(['--stdout', '--notitle', 'a.md'], root)
  assert.equal(status, 0)
  assert.ok(stdout.includes('- [A](#a)'))
  assert.ok(!stdout.includes('Table of Contents'))
  assert.equal(read(root, 'a.md'), '# A\n')
})

test('--stdout refuses more than one file', () => {
  const root = project({ 'a.md': '# A\n', 'b.md': '# B\n' })
  const { status, stderr } = run(['--stdout', '.'], root)
  assert.equal(status, 2)
  assert.match(stderr, /--stdout works with a single file/)
})

test('passes --title, --maxlevel and --update-only through', () => {
  const root = project({ 'a.md': '# A\n\n## A1\n', 'b.md': '# B\n' })
  writeFileSync(path.join(root, 'a.md'), '<!-- START doctoc -->\n<!-- END doctoc -->\n\n# A\n\n## A1\n')
  assert.equal(run(['--title', '## Contents', '--maxlevel', '1', '-u', '.'], root).status, 0)
  assert.ok(read(root, 'a.md').includes('## Contents\n\n- [A](#a)\n'))
  assert.equal(read(root, 'b.md'), '# B\n')
})

test('bad usage exits with code 2', () => {
  const root = project({ 'a.md': '# A\n' })
  assert.equal(run([], root).status, 2)
  assert.match(run(['--nope', 'a.md'], root).stderr, /--nope/)
  assert.equal(run(['--nope', 'a.md'], root).status, 2)
  assert.equal(run(['--maxlevel', 'x', 'a.md'], root).status, 2)
  assert.equal(run(['missing.md'], root).status, 2)
  const bitbucket = run(['--bitbucket', 'a.md'], root)
  assert.equal(bitbucket.status, 2)
  assert.match(bitbucket.stderr, /Bitbucket/)
})

test('a broken file is reported but the others are still processed', () => {
  const root = project({ 'bad.md': '<!-- START foldtoc -->\n# A\n', 'good.md': '# G\n' })
  const { status, stderr } = run(['.'], root)
  assert.equal(status, 1)
  assert.match(stderr, /bad\.md: .*END marker/)
  assert.ok(hasToc(read(root, 'good.md')))
})

test('--help and --version', () => {
  assert.match(run(['--help']).stdout, /Usage: foldtoc/)
  assert.match(run(['--version']).stdout, /^\d+\.\d+\.\d+\n$/)
})

// `foldtoc rm`

const fixtureDoc = readFileSync(new URL('./fixtures/example-doc.md', import.meta.url), 'utf8')

test('rm deletes a section and rebuilds the TOC, renumbering repeated anchors', () => {
  const root = project({ 'algo.md': fixtureDoc })
  run(['algo.md'], root)
  const { status, stdout } = run(['rm', 'algo.md', '#heap--priority-queue', '--yes'], root)
  assert.equal(status, 0)
  assert.match(stdout, /deleted\s+# Heap \/ Priority Queue\s+\(lines \d+-\d+, 9 sub-sections\)/)
  const text = read(root, 'algo.md')
  assert.ok(!text.includes('Heap / Priority Queue'))
  assert.ok(!text.includes('## Heapify'))
  // The section held three "Practice" headings, so the later ones move up by three.
  assert.ok(text.includes('(#practice-20)'))
  assert.ok(!text.includes('(#practice-21)'))
  assert.equal(run(['--dryrun', 'algo.md'], root).status, 0)
})

test('rm asks before deleting when it is not given --yes', async () => {
  const { main } = await import('../src/cli.js')
  const root = project({ 'a.md': '# A\n\n## Gone\n\ntext\n\n## Kept\n' })
  const out = []
  const io = (answer) => ({
    cwd: root,
    stdout: { write: (s) => out.push(s) },
    stderr: { write: (s) => out.push(s) },
    confirm: async () => answer,
  })

  assert.equal(await main(['rm', 'a.md', 'Gone'], io(false)), 0)
  assert.equal(read(root, 'a.md'), '# A\n\n## Gone\n\ntext\n\n## Kept\n')
  assert.match(out.join(''), /## Gone\s+\(lines 3-6\)/)
  assert.match(out.join(''), /Nothing deleted/)

  assert.equal(await main(['rm', 'a.md', 'Gone'], io(true)), 0)
  assert.equal(read(root, 'a.md'), '# A\n\n## Kept\n')
})

test('rm without --yes and without a terminal refuses', () => {
  const root = project({ 'a.md': '# A\n\n# B\n' })
  const { status, stderr } = run(['rm', 'a.md', 'B'], root)
  assert.equal(status, 2)
  assert.match(stderr, /--yes/)
  assert.equal(read(root, 'a.md'), '# A\n\n# B\n')
})

test('rm reports unknown and ambiguous sections without changing the file', () => {
  const root = project({ 'a.md': '# A\n\n## Practice\n\n## Practice\n' })
  const missing = run(['rm', 'a.md', 'Nope', '-y'], root)
  assert.equal(missing.status, 1)
  assert.match(missing.stderr, /no section "Nope"/)
  const ambiguous = run(['rm', 'a.md', 'Practice', '-y'], root)
  assert.equal(ambiguous.status, 1)
  assert.match(ambiguous.stderr, /#practice-1/)
  assert.equal(read(root, 'a.md'), '# A\n\n## Practice\n\n## Practice\n')
})

test('rm needs one file and at least one section', () => {
  const root = project({ 'a.md': '# A\n', 'docs/b.md': '# B\n' })
  assert.equal(run(['rm', 'a.md', '-y'], root).status, 2)
  assert.match(run(['rm', 'docs', 'B', '-y'], root).stderr, /a single file/)
  assert.equal(run(['rm', '-y'], root).status, 2)
})

test('rm leaves files without a TOC without one', () => {
  const root = project({ 'a.md': '# A\n\n# B\n' })
  assert.equal(run(['rm', 'a.md', 'B', '-y'], root).status, 0)
  assert.equal(read(root, 'a.md'), '# A\n')
})
