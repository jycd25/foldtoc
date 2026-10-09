import GithubSlugger from 'github-slugger'

// Returns a function that turns heading text into an anchor, numbering repeats
// ("practice", "practice-1", ...) the same way the host does.
export function createSlugger(anchors = 'github') {
  if (anchors === 'github') {
    const slugger = new GithubSlugger()
    return (text) => slugger.slug(text)
  }
  if (anchors === 'gitlab') return createGitlabSlugger()
  throw new Error(`Unknown anchor style: ${anchors}`)
}

// GitLab: lowercase, drop everything except word characters, spaces and hyphens,
// turn spaces into hyphens, squeeze runs of hyphens, then suffix repeats with -1, -2, ...
function createGitlabSlugger() {
  const seen = new Map()
  return (text) => {
    const base = text
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
      .replace(/ /g, '-')
      .replace(/-{2,}/g, '-')
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }
}
