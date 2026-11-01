import assert from "node:assert/strict"
import test from "node:test"
import { getRelatedNotes, getStudyContent, isAiLecture, isAiReviewed } from "./learning"

const note = (slug: string, title: string, extra: Record<string, unknown> = {}) => ({
  slug,
  filePath: `${slug}.md`,
  frontmatter: { title, ...extra },
})

test("AI lecture detection and review status are conservative", () => {
  assert.equal(
    isAiLecture(note("ADS/Chapter-8-动态规划-AI精讲", "Chapter 8 动态规划 · AI 精讲")),
    true,
  )
  assert.equal(isAiLecture(note("计算机网络/Chapter-1_ai", "Chapter 1 · AI 精讲")), true)
  assert.equal(isAiLecture(note("ADS/Chapter-8", "Chapter 8 动态规划")), false)
  assert.equal(isAiReviewed(note("ADS/x", "x", { ai_reviewed: true })), true)
  assert.equal(isAiReviewed(note("ADS/x", "x")), false)
})

test("study content supports custom prompts and pitfalls without inventing them", () => {
  const custom = getStudyContent(
    note("ADS/x", "x", {
      study_prompts: ["不写代码，说明 AVL 的四种旋转。"],
      pitfalls: ["旋转后忘记更新高度。"],
    }),
  )
  assert.deepEqual(custom.prompts, ["不写代码，说明 AVL 的四种旋转。"])
  assert.deepEqual(custom.pitfalls, ["旋转后忘记更新高度。"])
  assert.equal(custom.customized, true)

  const fallback = getStudyContent(note("ADS/x", "x"))
  assert.equal(fallback.prompts.length, 3)
  assert.equal(fallback.customized, false)
  assert.deepEqual(fallback.pitfalls, [])
})

test("related notes honor explicit references and same-chapter pairing", () => {
  const current = note("ADS/Chapter-8", "Chapter 8 动态规划")
  const ai = note("ADS/Chapter-8-AI精讲", "Chapter 8 动态规划 · AI 精讲")
  const other = note("ADS/Chapter-9", "Chapter 9 贪心算法")
  const explicit = note("OS/Chapter-5", "CPU 调度")
  const all = [current, ai, other, explicit]

  const paired = getRelatedNotes(current, all).map((n) => n.slug)
  assert.equal(paired[0], ai.slug)
  assert.ok(paired.includes(explicit.slug))
  assert.deepEqual(
    getRelatedNotes(
      note("ADS/Chapter-8", "Chapter 8 动态规划", { related: "OS/Chapter-5" }),
      all,
    ).map((n) => n.slug),
    [explicit.slug, ai.slug],
  )
})

test("cross-course links use explicit semantic rules only", () => {
  const dp = note("ADS/Chapter-8", "Chapter 8 动态规划")
  const scheduling = note("OS/Chapter-5", "Chapter 5 CPU 调度")
  const shortest = note("计算机网络/Chapter-5", "Chapter 5 最短路径路由")
  const unrelated = note("OOP/Chapter-8", "Chapter 8 Copy Constructor")
  const all = [dp, scheduling, shortest, unrelated]
  const related = getRelatedNotes(dp, all).map((n) => n.slug)
  assert.ok(related.includes(scheduling.slug))
  assert.ok(related.includes(shortest.slug))
  assert.ok(!related.includes(unrelated.slug))
  assert.equal(getRelatedNotes(dp, all, 1).length, 1)
  assert.deepEqual(
    getRelatedNotes(note("ADS/Chapter-8", "Chapter 8 动态规划", { related_auto: false }), all),
    [],
  )
})
