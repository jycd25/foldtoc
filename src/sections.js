import { parseDocument } from './markdown.js'
import { anchorHeadings } from './toc.js'

/**
 * Deletes whole sections (a heading, everything under it and its sub-sections)
 * from `content`. A target is either an anchor ("#heap", as linked from the
 * TOC) or heading text ("Heap", compared ignoring case and formatting); plain
 * text that matches no heading is also tried as an anchor.
 *
 * Throws, without changing anything, when a target matches no section or
 * several, or when a section contains the TOC.
 *
 * @param {string} content
 * @param {string[]} targets
 * @param {{anchors?: 'github' | 'gitlab'}} [options]
 * @returns {{content: string, removed: Array<{level: number, text: string, anchor: string,
 *            firstLine: number, lastLine: number, subsections: number}>}}
 */
export function removeSections(content, targets, { anchors } = {}) {
  const doc = parseDocument(content)
  const sections = findSections(doc, anchorHeadings(doc, anchors), content.length)

  const picked = new Set()
  for (const target of targets) {
    const section = matchSection(sections, target)
    if (doc.toc && section.start < doc.toc.end && doc.toc.start < section.end) {
      throw new Error(`can't delete "${target}": the section contains the TOC`)
    }
    picked.add(section)
  }

  // Sections nest, so one that starts inside another is deleted with it.
  const outer = []
  for (const section of [...picked].sort((a, b) => a.start - b.start)) {
    if (!outer.length || section.start >= outer.at(-1).end) outer.push(section)
  }

  let next = ''
  let cursor = 0
  for (const section of outer) {
    next += content.slice(cursor, section.start)
    cursor = section.end
  }
  next += content.slice(cursor)
  if (cursor === content.length) {
    // The file now ends where a deleted section began: tidy the blank lines.
    next = next.replace(/\s+$/, '')
    if (next) next += content.includes('\r\n') ? '\r\n' : '\n'
  }

  const lineOf = (offset) => content.slice(0, offset).split('\n').length
  return {
    content: next,
    removed: outer.map((section) => ({
      level: section.heading.level,
      text: section.heading.text.replace(/\s+/g, ' ').trim(),
      anchor: section.anchor,
      firstLine: lineOf(section.start),
      lastLine: lineOf(section.end - 1),
      subsections: section.subsections,
    })),
  }
}

// A section runs from its heading to the next heading of the same or a higher
// level (or the end of the file).
function findSections(doc, anchorList, length) {
  const sections = []
  doc.headings.forEach((heading, index) => {
    if (heading.nested || anchorList[index] === null) return
    sections.push({ heading, anchor: anchorList[index], start: heading.sectionStart })
  })
  sections.forEach((section, index) => {
    const later = sections.slice(index + 1)
    const next = later.find((other) => other.heading.level <= section.heading.level)
    section.end = next ? next.start : length
    section.subsections = later.filter((other) => other.start < section.end).length
  })
  return sections
}

function matchSection(sections, target) {
  const byAnchor = () => {
    const anchor = decodeAnchor(target.replace(/^#/, ''))
    return sections.filter((section) => section.anchor === anchor)
  }
  let matches
  if (target.startsWith('#')) {
    matches = byAnchor()
  } else {
    const wanted = normalize(target)
    matches = sections.filter(({ heading }) => normalize(heading.text) === wanted || normalize(heading.markdown) === wanted)
    if (!matches.length) matches = byAnchor()
  }

  if (matches.length === 1) return matches[0]
  if (!matches.length) throw new Error(`no section "${target}"`)
  const list = matches.map((section) => `#${section.anchor} (line ${section.heading.line})`).join(', ')
  throw new Error(`"${target}" matches ${matches.length} sections: ${list}. Name one by its anchor.`)
}

const normalize = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase()

// Anchors copied from a browser's address bar may be percent-encoded.
function decodeAnchor(anchor) {
  try {
    return decodeURIComponent(anchor)
  } catch {
    return anchor
  }
}
