import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { collectFiles } from '../src/files.js'

function makeTree() {
  const root = mkdtempSync(path.join(tmpdir(), 'foldtoc-files-'))
  for (const file of [
    'README.md',
    'notes.txt',
    'docs/guide.markdown',
    'docs/deep/page.mdx',
    'docs/deep/UPPER.MD',
    'node_modules/pkg/README.md',
    '.git/info.md',
  ]) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    writeFileSync(path.join(root, file), '# x\n')
  }
  return root
}

test('a bare file name is resolved against the current directory', async () => {
  const root = makeTree()
  assert.deepEqual(await collectFiles(['README.md'], root), [path.join(root, 'README.md')])
})

test('relative and absolute file paths both work', async () => {
  const root = makeTree()
  const abs = path.join(root, 'docs/guide.markdown')
  assert.deepEqual(await collectFiles(['./docs/../docs/guide.markdown', abs], root), [abs])
})

test('an explicitly named file is used whatever its extension', async () => {
  const root = makeTree()
  assert.deepEqual(await collectFiles(['notes.txt'], root), [path.join(root, 'notes.txt')])
})

test('a directory is searched recursively for markdown files, skipping node_modules and .git', async () => {
  const root = makeTree()
  assert.deepEqual(await collectFiles(['.'], root), [
    path.join(root, 'README.md'),
    path.join(root, 'docs/deep/UPPER.MD'),
    path.join(root, 'docs/deep/page.mdx'),
    path.join(root, 'docs/guide.markdown'),
  ])
})

test('a missing path is reported with where it was looked for', async () => {
  const root = makeTree()
  await assert.rejects(collectFiles(['READNE.md'], root), (err) => {
    assert.equal(err.name, 'UsageError')
    assert.match(err.message, /READNE\.md/)
    assert.ok(err.message.includes(path.join(root, 'READNE.md')))
    return true
  })
})
