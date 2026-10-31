import assert from "node:assert/strict"
import test from "node:test"
import {
  cleanNoteTitle,
  fixHighlightSyntax,
  rewriteImageRefs,
  upgradeListStructure,
} from "./note-transforms.mjs"

test("fixHighlightSyntax swaps nesting so Quartz highlight renders", () => {
  assert.equal(fixHighlightSyntax("==**术语**=="), "**==术语==**")
  assert.equal(fixHighlightSyntax("==**A**== 和 ==**B**=="), "**==A==** 和 **==B==**")
  // 已经正确或普通写法不受影响（幂等）
  assert.equal(fixHighlightSyntax("**==术语==**"), "**==术语==**")
  assert.equal(fixHighlightSyntax("==术语=="), "==术语==")
  assert.equal(fixHighlightSyntax(fixHighlightSyntax("==**术语**==")), "**==术语==**")
})

test("upgradeListStructure only converts bold-only chapter lists", () => {
  const source = ["- **第一章 概述**", "    - 内容 A", "    - 内容 B", "", "- **第二章**", "\t- 内容 C"].join(
    "\n",
  )
  const expected = ["## 第一章 概述", "- 内容 A", "- 内容 B", "", "## 第二章", "- 内容 C"].join("\n")
  assert.equal(upgradeListStructure(source), expected)
  // 幂等：转换后的内容再次执行不变
  assert.equal(upgradeListStructure(expected), expected)
  // 已有标题的文件不动
  const withHeading = "# 标题\n\n- **章节**\n    - 子项"
  assert.equal(upgradeListStructure(withHeading), withHeading)
  // 没有缩进子项的加粗列表（术语表）不动
  const terms = "- **术语 A**\n- **术语 B**"
  assert.equal(upgradeListStructure(terms), terms)
  // 列表项带其他文本时不动
  const mixed = "- **章节** 说明文字\n    - 子项"
  assert.equal(upgradeListStructure(mixed), mixed)
})

test("cleanNoteTitle strips numbering, course prefix and marks AI notes", () => {
  assert.equal(cleanNoteTitle("01-计算机网络.md", "计算机网络"), "计算机网络")
  assert.equal(cleanNoteTitle("Chapter3.md"), "Chapter 3")
  assert.equal(cleanNoteTitle("03. Chapter 3.md"), "Chapter 3")
  assert.equal(cleanNoteTitle("计算机系统原理 第五章 内存管理.md", "计算机系统原理"), "第五章 内存管理")
  assert.equal(cleanNoteTitle("Chapter 1_ai.md", "计算机网络"), "Chapter 1 · AI 精讲")
  assert.equal(cleanNoteTitle("01-绪论_ai.md"), "绪论 · AI 精讲")
})

test("rewriteImageRefs only rewrites converted images", () => {
  const converted = new Set(["diagram.webp"])
  assert.equal(rewriteImageRefs("![[diagram.png]]", converted), "![[diagram.webp]]")
  assert.equal(rewriteImageRefs("![[diagram.png|300]]", converted), "![[diagram.webp|300]]")
  assert.equal(rewriteImageRefs("![图](img/diagram.png)", converted), "![图](img/diagram.webp)")
  // 未转换成功的文件保持原样
  assert.equal(rewriteImageRefs("![[other.png]]", converted), "![[other.png]]")
  assert.equal(rewriteImageRefs("![图](other.jpg)", converted), "![图](other.jpg)")
  // 空集合时整体不动
  assert.equal(rewriteImageRefs("![[diagram.png]]", new Set()), "![[diagram.png]]")
})
