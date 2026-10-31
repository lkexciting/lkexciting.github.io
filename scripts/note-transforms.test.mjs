import assert from "node:assert/strict"
import test from "node:test"
import {
  cleanNoteTitle,
  dropBrokenImageEmbeds,
  fixCjkSpacing,
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

test("fixCjkSpacing adds pangu spacing without touching protected segments", () => {
  assert.equal(fixCjkSpacing("尽量使用Private而不是Public"), "尽量使用 Private 而不是 Public")
  assert.equal(fixCjkSpacing("速率可达10Gbps"), "速率可达 10Gbps")
  assert.equal(fixCjkSpacing("第1章内容"), "第 1 章内容")
  // 幂等
  assert.equal(fixCjkSpacing("尽量使用 Private 而不是 Public"), "尽量使用 Private 而不是 Public")
  // 已有空格的不重复加
  assert.equal(fixCjkSpacing("高度 centralized（集中）式"), "高度 centralized（集中）式")
  // 代码与公式受保护
  assert.equal(fixCjkSpacing("使用`const x=1`并保持$H=p^2$不变"), "使用`const x=1`并保持$H=p^2$不变")
  assert.equal(fixCjkSpacing("链接[[计算机网络/notes/Chapter 1|第1章]]路径不变"), "链接[[计算机网络/notes/Chapter 1|第1章]]路径不变")
  assert.equal(fixCjkSpacing("跳转[文字](some/path.md)不变"), "跳转[文字](some/path.md)不变")
  // 代码块整块跳过
  const code = "```js\nconst 中文 = 1\n```"
  assert.equal(fixCjkSpacing(code), code)
  // 数学块整块跳过
  const math = "$$\nH = \\text{负载}\n$$"
  assert.equal(fixCjkSpacing(math), math)
})

test("fixCjkSpacing removes stray spaces around fullwidth punctuation", () => {
  assert.equal(fixCjkSpacing("take over the world ？"), "take over the world？")
  assert.equal(fixCjkSpacing("集中 ）收尾"), "集中）收尾")
  assert.equal(fixCjkSpacing("（ 集中）开头的空格"), "（集中）开头的空格")
})

test("dropBrokenImageEmbeds only removes missing assets", () => {
  const assets = new Set(["diagram.webp", "photo.png"])
  assert.equal(dropBrokenImageEmbeds("![[diagram.webp]]", assets), "![[diagram.webp]]")
  assert.equal(dropBrokenImageEmbeds("![[photo.png|300]]", assets), "![[photo.png|300]]")
  assert.equal(dropBrokenImageEmbeds("前文![[missing.png|531]]后文", assets), "前文后文")
  // URL 编码的路径也能按 basename 匹配
  assert.equal(dropBrokenImageEmbeds("![[%E5%9B%BE/photo.png]]", assets), "![[%E5%9B%BE/photo.png]]")
  // 非图片嵌入不受影响
  assert.equal(dropBrokenImageEmbeds("[[某笔记]]", assets), "[[某笔记]]")
})
