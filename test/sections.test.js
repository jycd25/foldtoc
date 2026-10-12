import { test } from 'node:test'
import assert from 'node:assert/strict'
import { removeSections } from '../src/sections.js'

const doc = [
  '# A', '', 'text a', '',
  '## A1', '', 'x', '',
  '### A1a', '', 'y', '',
  '## A2', '', 'z', '',
].join('\n')

test('removes a section with its sub-sections, up to the next heading of the same level', () => {
  const { content, removed } = removeSections(doc, ['A1'])
  assert.equal(content, '# A\n\ntext a\n\n## A2\n\nz\n')
  assert.deepEqual(removed, [{ level: 2, text: 'A1', anchor: 'a1', firstLine: 5, lastLine: 12, subsections: 1 }])
})

test('a section can be named by its anchor, with or without #', () => {
  assert.equal(removeSections(doc, ['#a1']).content, '# A\n\ntext a\n\n## A2\n\nz\n')
  assert.equal(removeSections(doc, ['a1a']).content, '# A\n\ntext a\n\n## A1\n\nx\n\n## A2\n\nz\n')
})

test('anchors tell apart headings with the same name', () => {
  const twice = '## Practice\n\none\n\n## Practice\n\ntwo\n'
  assert.equal(removeSections(twice, ['#practice-1']).content, '## Practice\n\none\n')
  assert.throws(() => removeSections(twice, ['Practice']), (err) => {
    assert.match(err.message, /"Practice" matches 2 sections/)
    assert.match(err.message, /#practice\b/)
    assert.match(err.message, /#practice-1/)
    return true
  })
})

test('heading text matches ignoring case and inline formatting', () => {
  const code = '# `nums` Array\n\nx\n\n# Other\n'
  assert.equal(removeSections(code, ['nums array']).content, '# Other\n')
  assert.equal(removeSections(code, ['`nums` Array']).content, '# Other\n')
})

test('an unknown section is an error', () => {
  assert.throws(() => removeSections(doc, ['Nope']), /no section "Nope"/)
})

test('removing the last section leaves a single trailing newline', () => {
  assert.equal(removeSections('# A\n\na\n\n# B\n\nb\n\n\n', ['B']).content, '# A\n\na\n')
})

test('an EXCLUDE comment goes with its heading and the next one keeps its own', () => {
  const excluded = '# A\n\n<!-- FOLDTOC EXCLUDE -->\n# B\n\nb\n\n<!-- FOLDTOC EXCLUDE -->\n# C\n'
  assert.equal(removeSections(excluded, ['B']).content, '# A\n\n<!-- FOLDTOC EXCLUDE -->\n# C\n')
})

test('headings inside code blocks do not end a section', () => {
  assert.equal(removeSections('# A\n\n```\n# not a heading\n```\n\n# B\n', ['A']).content, '# B\n')
})

test('a section that contains the TOC cannot be removed', () => {
  const withToc = '# Title\n\n<!-- START foldtoc -->\n<!-- END foldtoc -->\n\n## One\n'
  assert.throws(() => removeSections(withToc, ['Title']), /contains the TOC/)
  assert.equal(removeSections(withToc, ['One']).content, '# Title\n\n<!-- START foldtoc -->\n<!-- END foldtoc -->\n')
})

test('several sections at once; one inside another is covered by the outer one', () => {
  const { content, removed } = removeSections(doc, ['A1a', 'A1', 'A2'])
  assert.equal(content, '# A\n\ntext a\n')
  assert.deepEqual(removed.map((section) => section.text), ['A1', 'A2'])
})

test('gitlab anchors', () => {
  assert.equal(removeSections('# A / B\n\n# C\n', ['#a-b'], { anchors: 'gitlab' }).content, '# C\n')
})

test('keeps Windows line endings', () => {
  assert.equal(removeSections('# A\r\n\r\na\r\n\r\n# B\r\n\r\nb\r\n', ['B']).content, '# A\r\n\r\na\r\n')
})
