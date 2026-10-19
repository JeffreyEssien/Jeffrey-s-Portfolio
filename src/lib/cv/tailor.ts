// Keyword-based CV tailoring — no AI, no network. Deterministically reorders a Cv's
// experience, project, and skill items so the pieces that best match a pasted job
// description surface first. It only reorders existing content; it never rewrites,
// invents, or deletes anything (the editor still shows every item for review).
import type { Cv, CvSection } from '../content'

// English function words + generic job-posting filler that carry no matching signal.
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have', 'in', 'into',
  'is', 'it', 'its', 'of', 'on', 'or', 'our', 'the', 'to', 'we', 'with', 'you', 'your', 'will',
  'this', 'that', 'these', 'those', 'can', 'may', 'must', 'should', 'able', 'who', 'what', 'when',
  'where', 'which', 'etc', 'including', 'include', 'includes', 'such', 'about', 'across', 'per',
  'role', 'job', 'position', 'candidate', 'candidates', 'applicant', 'company', 'team', 'teams',
  'work', 'working', 'join', 'looking', 'seeking', 'responsibilities', 'requirements', 'required',
  'preferred', 'plus', 'years', 'year', 'experience', 'experienced', 'skills', 'ability', 'strong',
  'good', 'excellent', 'knowledge', 'understanding', 'well', 'help', 'ensure', 'within', 'using',
])

// Keep letters, digits, and the symbols that matter in tech terms (c++, c#, node.js).
const tokenize = (text: string): string[] =>
  (text.toLowerCase().match(/[a-z][a-z0-9+#.]*/g) ?? [])
    .map((t) => t.replace(/\.$/, ''))
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))

// JD term → weight (how often it appears in the posting; repeated terms matter more).
function jdTermWeights(jobDescription: string): Map<string, number> {
  const weights = new Map<string, number>()
  for (const t of tokenize(jobDescription)) weights.set(t, (weights.get(t) ?? 0) + 1)
  return weights
}

// Sum of JD weights for every distinct JD term that appears in the given CV text.
function scoreText(text: string, weights: Map<string, number>): number {
  const tokens = new Set(tokenize(text))
  let score = 0
  for (const t of tokens) score += weights.get(t) ?? 0
  return score
}

// Stable descending sort by score — preserves original order when scores tie.
function stableSortByScore<T>(items: T[], score: (item: T) => number): T[] {
  return items
    .map((item, i) => ({ item, i, s: score(item) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.item)
}

function tailorSection(section: CvSection, w: Map<string, number>): CvSection {
  switch (section.type) {
    case 'experience':
      return {
        ...section,
        items: stableSortByScore(
          section.items.map((it) => ({
            ...it,
            bullets: stableSortByScore(it.bullets, (b) => scoreText(b.text, w)),
          })),
          (it) => scoreText([it.role, it.company, ...it.bullets.map((b) => b.text)].join(' '), w),
        ),
      }
    case 'projects':
      return {
        ...section,
        items: stableSortByScore(
          section.items.map((it) => ({
            ...it,
            bullets: stableSortByScore(it.bullets, (b) => scoreText(b.text, w)),
          })),
          (it) => scoreText([it.title, it.description, ...it.bullets.map((b) => b.text)].join(' '), w),
        ),
      }
    case 'skills':
      return {
        ...section,
        groups: stableSortByScore(
          section.groups.map((g) => ({
            ...g,
            items: stableSortByScore(g.items, (s) => scoreText(s, w)),
          })),
          (g) => scoreText(g.items.join(' '), w),
        ),
      }
    default:
      // summary, education, certifications, custom — order left untouched.
      return section
  }
}

export type TailorResult = { cv: Cv; matchedTerms: string[] }

export function tailorCv(cv: Cv, jobDescription: string): TailorResult {
  const weights = jdTermWeights(jobDescription)

  // Which JD terms actually appear somewhere in the CV — shown to the user as the match summary.
  const cvText = [
    cv.personal.headline,
    ...cv.sections.flatMap((s) => {
      if (s.type === 'summary') return [s.body]
      if (s.type === 'experience') return s.items.flatMap((i) => [i.role, i.company, ...i.bullets.map((b) => b.text)])
      if (s.type === 'projects') return s.items.flatMap((i) => [i.title, i.description, ...i.bullets.map((b) => b.text)])
      if (s.type === 'skills') return s.groups.flatMap((g) => g.items)
      if (s.type === 'education') return s.items.flatMap((i) => [i.degree, i.school, i.details])
      return s.items.map((i) => i.text)
    }),
  ].join(' ')
  const cvTokens = new Set(tokenize(cvText))
  const matchedTerms = [...weights.keys()]
    .filter((t) => cvTokens.has(t))
    .sort((a, b) => (weights.get(b) ?? 0) - (weights.get(a) ?? 0))

  return {
    cv: { ...cv, sections: cv.sections.map((s) => tailorSection(s, weights)) },
    matchedTerms,
  }
}
