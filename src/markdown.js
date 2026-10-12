import { fromMarkdown } from 'mdast-util-from-markdown'

// doctoc's markers are recognised too, so a doctoc TOC is replaced in place.
const START = /^<!--\s*START\s+(?:doctoc|foldtoc)\b[\s\S]*-->$/i
const END = /^<!--\s*END\s+(?:doctoc|foldtoc)\b[\s\S]*-->$/i
const SKIP = /^<!--\s*(?:doctoc|foldtoc)\s+SKIP\s*-->$/i
const EXCLUDE = /^<!--\s*(?:doctoc|foldtoc)\s+EXCLUDE\s*-->$/i
const FRONT_MATTER = /^\uFEFF?(---|\+\+\+)[ \t]*\r?\n(?:[\s\S]*?\r?\n)?\1[ \t]*(?:\r?\n|$)/

/**
 * Reads what the TOC generator needs from a markdown document. All offsets
 * point into `content`.
 *
 * @returns {{
 *   headings: Array<{level: number, start: number, line: number, text: string,
 *                    markdown: string, html: string, excluded: boolean,
 *                    nested: boolean, sectionStart?: number}>,
 *   toc: {start: number, end: number} | null,
 *   skip: boolean,
 *   bodyStart: number,
 * }}
 */
export function parseDocument(content) {
  const frontMatter = FRONT_MATTER.exec(content)?.[0] ?? ''
  const bodyStart = frontMatter ? frontMatter.length : content.startsWith('\uFEFF') ? 1 : 0
  // Blank out front matter (keeping line breaks, so offsets stay valid);
  // otherwise `title: x` followed by `---` would parse as a heading.
  const source = frontMatter.replace(/[^\r\n]/g, ' ') + content.slice(frontMatter.length)
  const tree = fromMarkdown(source)

  const headings = []
  let start = null
  let end = null
  let skip = false
  let excludeComment = null

  for (const node of tree.children) {
    if (node.type === 'html') {
      const html = node.value.trim()
      if (EXCLUDE.test(html)) {
        excludeComment = node
        continue
      }
      if (SKIP.test(html)) skip = true
      else if (!start && START.test(html)) start = node
      else if (start && !end && END.test(html)) end = node
    } else if (node.type === 'heading') {
      // A section starts at its heading's line, or at the EXCLUDE comment above it.
      const sectionStart = lineStart(source, (excludeComment ?? node).position.start.offset)
      headings.push(readHeading(node, source, { excluded: Boolean(excludeComment), nested: false, sectionStart }))
    } else {
      // Headings inside block quotes or lists get anchors on GitHub too, so they
      // count towards "-1", "-2" numbering even though they stay out of the TOC.
      for (const heading of nestedHeadings(node)) {
        headings.push(readHeading(heading, source, { excluded: false, nested: true }))
      }
    }
    excludeComment = null
  }

  if (start && !end) throw new Error('found a START marker without a matching END marker')
  const toc = start ? { start: start.position.start.offset, end: end.position.end.offset } : null
  return { headings, toc, skip, bodyStart }
}

function* nestedHeadings(node) {
  for (const child of node.children ?? []) {
    if (child.type === 'heading') yield child
    else yield* nestedHeadings(child)
  }
}

const lineStart = (source, offset) => source.lastIndexOf('\n', offset - 1) + 1

function readHeading(node, source, flags) {
  return {
    level: node.depth,
    start: node.position.start.offset,
    line: node.position.start.line,
    text: plainText(node.children),
    markdown: oneLine(inlineMarkdown(node.children, source)),
    html: oneLine(inlineHtml(node.children)),
    ...flags,
  }
}

const oneLine = (value) => value.replace(/[ \t]*\r?\n[ \t]*/g, ' ').trim()

const slice = (source, node) => source.slice(node.position.start.offset, node.position.end.offset)

// The text the host builds the anchor from: what a reader sees, without markup.
function plainText(nodes) {
  return nodes
    .map((node) => {
      if (node.type === 'text' || node.type === 'inlineCode') return node.value
      return node.children ? plainText(node.children) : ''
    })
    .join('')
}

// Heading as markdown for use inside [link text]: links are unwrapped (links
// can't nest) and stray brackets escaped; everything else is kept as written.
function inlineMarkdown(nodes, source) {
  return nodes
    .map((node) => {
      if (node.type === 'link' || node.type === 'linkReference') return inlineMarkdown(node.children, source)
      if (node.type === 'text') return slice(source, node).replace(/(?<!\\)[[\]]/g, '\\$&')
      if (node.children?.length) {
        const first = node.children[0].position.start.offset
        const last = node.children.at(-1).position.end.offset
        const open = source.slice(node.position.start.offset, first)
        const close = source.slice(last, node.position.end.offset)
        return open + inlineMarkdown(node.children, source) + close
      }
      return slice(source, node)
    })
    .join('')
}

// Heading as HTML for use inside <summary>, where markdown is not rendered.
function inlineHtml(nodes) {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
          return escapeHtml(node.value)
        case 'inlineCode':
          return `<code>${escapeHtml(node.value)}</code>`
        case 'emphasis':
          return `<em>${inlineHtml(node.children)}</em>`
        case 'strong':
          return `<strong>${inlineHtml(node.children)}</strong>`
        case 'html':
          return node.value.replace(/<\/?a\b[^>]*>/gi, '')
        case 'break':
          return ' '
        default:
          return node.children ? inlineHtml(node.children) : ''
      }
    })
    .join('')
}

const escapeHtml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
