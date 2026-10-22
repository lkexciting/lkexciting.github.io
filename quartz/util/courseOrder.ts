interface CourseEntry {
  displayName?: string
  frontmatter?: { title: string }
}

// Keep this function self-contained: Explorer serializes it for the browser.
export function byCourseOrder(a: CourseEntry, b: CourseEntry): number {
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
