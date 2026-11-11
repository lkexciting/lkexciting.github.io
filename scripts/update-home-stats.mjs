import { readdir, readFile, writeFile } from 'node:fs/promises'
import matter from 'gray-matter'

const root = new URL('../content/', import.meta.url)
const courses = (await readdir(root, { withFileTypes: true })).filter(e => e.isDirectory())
let total = 0
let words = 0
const counts = new Map()
for (const course of courses) {
  let count = 0
  for (const file of await readdir(new URL(encodeURIComponent(course.name) + '/', root))) {
    if (!file.endsWith('.md') || /^(index|分步学习|课程大纲|复习导航|课件精讲)\.md$/.test(file)) continue
    const { content } = matter(await readFile(new URL(encodeURIComponent(course.name) + '/' + encodeURIComponent(file), root), 'utf8'))
    const text = content.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/<[^>]*>/g, '').replace(/\]\([^)]*\)/g, ']')
    words += (text.match(/[\u3400-\u9fff]/g) || []).length + (text.match(/[A-Za-z0-9]+/g) || []).length
    count++
  }
  counts.set(course.name, count)
  total += count
}
const home = new URL('index.md', root)
let html = await readFile(home, 'utf8')
const formatted = words >= 10000 ? (words / 10000).toFixed(1).replace(/\.0$/, '') + ' 万' : String(words)
html = html.replace(/(<strong>)[^<]*(<\/strong> 个学习方向)/, `$1${String(courses.length).padStart(2, '0')}$2`)
  .replace(/(<strong>)[^<]*(<\/strong> 篇课程笔记)/, `$1${total}$2`)
  .replace(/(<strong>)约 [^<]*(<\/strong> 字)/, `$1约 ${formatted}$2`)
html = html.replace(/<div class="course-card">[\s\S]*?<\/div>/g, card => {
  const course = card.match(/href="\.\/([^/]+)\//)?.[1]
  return counts.has(course) ? card.replace(/\d+ 篇笔记/, `${counts.get(course)} 篇笔记`) : card
})
await writeFile(home, html)
console.log(`首页统计：${courses.length} 门课程，${total} 篇笔记，约 ${formatted} 字`)
