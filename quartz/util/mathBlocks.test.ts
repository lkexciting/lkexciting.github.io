import assert from "node:assert/strict"
import test from "node:test"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkMath from "remark-math"
import { normalizeMathBlocks } from "./mathBlocks"

test("multiline Obsidian display math cannot swallow subsequent prose or headings", () => {
  const source =
    "$$H=p^2,\\quad\np=-i\\hbar.$$\n\n正文\n\n### 1.3 演化\n\n$$U=e^{-iHt}.$$"
  const normalized = normalizeMathBlocks(source)
  const tree = unified().use(remarkParse).use(remarkMath).parse(normalized)
  assert.equal(tree.children.filter((node) => node.type === "math").length, 2)
  assert.equal(tree.children.filter((node) => node.type === "heading").length, 1)
  assert.equal(tree.children.filter((node) => node.type === "paragraph").length, 1)
  assert.equal(normalizeMathBlocks(normalized), normalized)
})

test("code fences and inline formulas remain unchanged", () => {
  const source = "行内 $H$\n\n```markdown\n$$H=x\n第二行$$\n```\n\n~~~text\n$$raw$$\n~~~"
  assert.equal(normalizeMathBlocks(source), source)
})
