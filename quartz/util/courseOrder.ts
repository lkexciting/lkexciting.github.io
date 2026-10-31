interface CourseEntry {
  displayName?: string
  frontmatter?: { title: string }
  slug?: string
  filePath?: string
}

// Keep this function self-contained: Explorer serializes it for the browser.
export function byCourseOrder(a: CourseEntry, b: CourseEntry): number {
  // 辅助函数必须声明在 byCourseOrder 内部：整个函数会被 toString() 序列化到浏览器执行
  function isAiNote(entry: CourseEntry): boolean {
    // 标题后缀（经清理后形如「Chapter 1 · AI 精讲」）
    const name = entry.displayName ?? entry.frontmatter?.title ?? ""
    if (/·\s*AI\s*精讲/.test(name)) return true
    // 文件名 / slug 后缀：`Chapter 1_ai`、`Chapter-1_ai`、`Chapter 8 动态规划 AI精讲`
    const file = (entry.filePath ?? entry.slug ?? "").replace(/\.md$/i, "")
    return /_ai$/i.test(file) || /(?:^|\s)AI\s*精讲$/i.test(file)
  }
  // AI 精讲笔记统一排到所在目录的最后
  const leftIsAi = isAiNote(a)
  const rightIsAi = isAiNote(b)
  if (leftIsAi !== rightIsAi) return leftIsAi ? 1 : -1

  function key(entry: CourseEntry): [number, number, string] {
    const name = (entry.displayName ?? entry.frontmatter?.title ?? "").trim()
    if (/\boutline\b/i.test(name)) return [0, 0, name]
    const arabic = name.match(/(?:chapter|lesson)\s*(\d+)/i) ?? name.match(/^(\d+)/)
    if (arabic) return [1, Number(arabic[1]), name]
    const chinese = name.match(/第([零〇一二两三四五六七八九十百\d]+)[章节课]/)
    if (chinese) {
      const digits: Record<string, number> = {
        零: 0,
        〇: 0,
        一: 1,
        二: 2,
        两: 2,
        三: 3,
        四: 4,
        五: 5,
        六: 6,
        七: 7,
        八: 8,
        九: 9,
      }
      let value = 0
      let digit = 0
      for (const char of chinese[1]) {
        if (char === "十" || char === "百") {
          value += (digit || 1) * (char === "十" ? 10 : 100)
          digit = 0
        } else {
          digit = digits[char] ?? Number(char)
        }
      }
      return [1, /^\d+$/.test(chinese[1]) ? Number(chinese[1]) : value + digit, name]
    }
    return [2, 0, name]
  }
  const left = key(a)
  const right = key(b)
  return (
    left[0] - right[0] ||
    left[1] - right[1] ||
    left[2].localeCompare(right[2], "zh-CN", { numeric: true, sensitivity: "base" })
  )
}
