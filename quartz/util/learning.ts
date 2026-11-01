import { byCourseOrder } from "./courseOrder"

type NoteData = {
  slug?: string
  filePath?: string
  text?: string
  frontmatter?: {
    title?: string
    related?: string | string[]
    study?: string | string[]
    study_prompts?: string | string[]
    pitfalls?: string | string[]
    study_guide?: boolean
    related_auto?: boolean
    ai_reviewed?: boolean
    reviewed?: boolean
    tags?: string[]
  }
}

export function isAiLecture(note: NoteData): boolean {
  const title = note.frontmatter?.title ?? ""
  const file = (note.filePath ?? note.slug ?? "").replace(/\.md$/i, "")
  return /·\s*AI\s*精讲/.test(title) || /_ai$/i.test(file) || /(?:^|\s)AI\s*精讲$/i.test(file)
}

export function isAiReviewed(note: NoteData): boolean {
  return note.frontmatter?.ai_reviewed === true || note.frontmatter?.reviewed === true
}

function asList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return typeof value === "string" && value.trim() ? [value.trim()] : []
}

export interface StudyContent {
  prompts: string[]
  pitfalls: string[]
  customized: boolean
}

/**
 * 自测题与易错点完全来自笔记 frontmatter；没有填写时只提供不依赖具体答案的复习方法，
 * 不替作者编造“个人理解”。
 */
export function getStudyContent(note: NoteData): StudyContent {
  const customPrompts = [
    ...asList(note.frontmatter?.study_prompts),
    ...asList(note.frontmatter?.study),
  ]
  const pitfalls = asList(note.frontmatter?.pitfalls)
  return {
    prompts:
      customPrompts.length > 0
        ? customPrompts
        : [
            "合上笔记，回忆本章的 3 个核心概念，并检查遗漏。",
            "选一道典型题，不看答案完整写出推导或解题步骤。",
            "用自己的话解释一个易混点，再对照课件或正文核对。",
          ],
    pitfalls,
    customized: customPrompts.length > 0 || pitfalls.length > 0,
  }
}

interface ScoredNote {
  note: NoteData
  score: number
}

function baseChapterTitle(note: NoteData): string {
  return (note.frontmatter?.title ?? "")
    .replace(/\s*·\s*AI\s*精讲.*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function sameCourse(a: NoteData, b: NoteData): boolean {
  return (a.slug ?? "").split("/")[0] === (b.slug ?? "").split("/")[0]
}

// 只收录语义明确的跨课程关系。匹配标题与 slug，返回时可追溯对应规则。
const CROSS_COURSE_RULES: [RegExp, RegExp][] = [
  [/动态规划|dynamic programming/i, /调度|最短路径|路由/i],
  [/调度|最短路径|路由/i, /动态规划|dynamic programming/i],
  [/memory model|内存模型/i, /memory hierarchy|存储层次|内存管理/i],
  [/memory hierarchy|存储层次|内存管理/i, /memory model|内存模型/i],
]

function searchText(note: NoteData): string {
  // 正文让「Chapter N」这类通用标题也能按实际内容建立关联
  return `${note.slug ?? ""} ${note.filePath ?? ""} ${note.frontmatter?.title ?? ""} ${note.text ?? ""}`
}

function titleText(note: NoteData): string {
  return `${note.slug ?? ""} ${note.filePath ?? ""} ${note.frontmatter?.title ?? ""}`
}

function crossCourseScore(source: NoteData, target: NoteData): number {
  const sourceText = searchText(source)
  const targetTitle = titleText(target)
  for (const [from, to] of CROSS_COURSE_RULES) {
    if (!from.test(sourceText)) continue
    if (to.test(targetTitle)) return 3
    // 通用标题下，正文至少 3 次讨论目标概念才建立链接，避免概论页被泛泛关联
    const mentions = target.text?.match(new RegExp(to.source, "gi"))?.length ?? 0
    if (mentions >= 3) return 2
  }
  return 0
}

/** 相关笔记优先级：显式 related > 同章正文/AI精讲 > 明确跨课程规则 > 共享标签。 */
export function getRelatedNotes(current: NoteData, allFiles: NoteData[], limit = 3): NoteData[] {
  if (!current.slug || current.slug === "index" || current.slug.endsWith("/index")) return []
  const candidates = (allFiles as NoteData[]).filter(
    (note) =>
      note.slug &&
      note.slug !== current.slug &&
      note.slug !== "index" &&
      !note.slug.endsWith("/index") &&
      note.frontmatter?.title,
  )
  const bySlug = new Map(candidates.map((note) => [note.slug!, note]))
  const explicit = asList(current.frontmatter?.related)
  const chosen: NoteData[] = []
  const seen = new Set<string>([current.slug])
  const add = (note: NoteData | undefined) => {
    if (!note?.slug || seen.has(note.slug)) return
    seen.add(note.slug)
    chosen.push(note)
  }

  for (const ref of explicit) {
    const normalized = ref.replace(/\.md$/i, "").replace(/^\/+|\/+$/g, "")
    add(
      bySlug.get(normalized) ??
        candidates.find(
          (note) =>
            note.frontmatter?.title === ref || note.filePath?.replace(/\.md$/i, "") === normalized,
        ),
    )
  }

  if (current.frontmatter?.related_auto !== false && chosen.length < limit) {
    const scored: ScoredNote[] = []
    const currentBase = baseChapterTitle(current)
    const currentTags = new Set(current.frontmatter?.tags ?? [])
    for (const note of candidates) {
      if (seen.has(note.slug!)) continue
      let score = 0
      if (sameCourse(current, note) && currentBase && baseChapterTitle(note) === currentBase) {
        score = 4 // 同一章节的正文与 AI 精讲互相关联
      } else if (!sameCourse(current, note)) {
        score = crossCourseScore(current, note)
      }
      if (score === 0 && currentTags.size > 0) {
        const shared = (note.frontmatter?.tags ?? []).filter((tag) => currentTags.has(tag))
        if (shared.length > 0) score = 1
      }
      if (score > 0) scored.push({ note, score })
    }
    scored.sort(
      (a, b) =>
        b.score - a.score ||
        byCourseOrder(
          a.note as Parameters<typeof byCourseOrder>[0],
          b.note as Parameters<typeof byCourseOrder>[1],
        ),
    )
    for (const { note } of scored) add(note)
  }

  return chosen.slice(0, limit)
}
