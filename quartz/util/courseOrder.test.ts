import assert from "node:assert/strict"
import test from "node:test"
import { byCourseOrder } from "./courseOrder"

test("AI notes sort to the end of their folder", () => {
  const chapter1 = { frontmatter: { title: "Chapter 1" }, filePath: "计算机网络/Chapter 1.md" }
  const chapter2 = { frontmatter: { title: "Chapter 2" }, filePath: "计算机网络/Chapter 2.md" }
  const aiNote = {
    frontmatter: { title: "Chapter 1 · AI 精讲" },
    filePath: "计算机网络/Chapter 1_ai.md",
  }
  assert.ok(byCourseOrder(chapter1, aiNote) < 0)
  assert.ok(byCourseOrder(chapter2, aiNote) < 0)
  assert.ok(byCourseOrder(aiNote, chapter1) > 0)
  // 多个 AI 笔记之间保持章节顺序
  const aiNote2 = {
    frontmatter: { title: "Chapter 2 · AI 精讲" },
    filePath: "计算机网络/Chapter 2_ai.md",
  }
  assert.ok(byCourseOrder(aiNote, aiNote2) < 0)
})

test("AI detection also works from slug or title alone", () => {
  const bySlug = { displayName: "Chapter 1", slug: "计算机网络/Chapter-1_ai" }
  const regular = { displayName: "Chapter 2", slug: "计算机网络/Chapter-2" }
  assert.ok(byCourseOrder(regular, bySlug) < 0)
  // 标题带「· AI 精讲」但路径没有 _ai 后缀时同样识别
  const byTitle = { displayName: "Chapter 3 · AI 精讲" }
  assert.ok(byCourseOrder(regular, byTitle) < 0)
})

test("non-AI ordering is unchanged", () => {
  const outline = { displayName: "Outline" }
  const chapter1 = { displayName: "Chapter 1" }
  const chapter2 = { displayName: "Chapter 2" }
  const chapter10 = { displayName: "Chapter 10" }
  const appendix = { displayName: "附录" }
  assert.ok(byCourseOrder(outline, chapter1) < 0)
  assert.ok(byCourseOrder(chapter1, chapter2) < 0)
  assert.ok(byCourseOrder(chapter2, chapter10) < 0, "numeric compare, not lexicographic")
  assert.ok(byCourseOrder(chapter10, appendix) < 0)
})
