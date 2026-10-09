export const DEFAULT_TITLE = '**Table of Contents**'

/**
 * Renders TOC entries (in document order) as a markdown list in which every
 * entry that has sub-entries is a collapsed <details> toggle.
 *
 * @param {Array<{level: number, anchor: string, markdown: string, html: string}>} entries
 * @param {{title?: string, entryPrefix?: string}} [options] title '' means no title
 */
export function renderToc(entries, { title = DEFAULT_TITLE, entryPrefix = '-' } = {}) {
  if (!entries.length) return ''
  const roots = buildTree(entries)
  const lines = title ? [title, ''] : []
  // With a single top-level entry (a README's one `# Title`), collapsing it
  // would hide the whole TOC, so that one starts open.
  const openRoot = roots.length === 1
  for (const root of roots) renderEntry(root, 0, openRoot, entryPrefix, lines)
  while (lines.at(-1) === '') lines.pop()
  return lines.join('\n')
}

// Each entry becomes a child of the nearest earlier entry with a lower level.
function buildTree(entries) {
  const roots = []
  const stack = []
  for (const entry of entries) {
    const node = { ...entry, children: [] }
    while (stack.length && stack.at(-1).level >= node.level) stack.pop()
    ;(stack.length ? stack.at(-1).children : roots).push(node)
    stack.push(node)
  }
  return roots
}

// Children sit two spaces deeper, i.e. inside the parent list item, and the
// blank lines around them let GitHub render markdown inside the HTML block.
function renderEntry(node, depth, open, prefix, lines) {
  const indent = '  '.repeat(depth)
  if (!node.children.length) {
    lines.push(`${indent}${prefix} [${node.markdown}](#${node.anchor})`)
    return
  }
  const details = open ? '<details open>' : '<details>'
  lines.push(`${indent}${prefix} ${details}<summary><a href="#${node.anchor}">${node.html}</a></summary>`, '')
  for (const child of node.children) renderEntry(child, depth + 1, false, prefix, lines)
  lines.push(`${indent}  </details>`, '')
}
