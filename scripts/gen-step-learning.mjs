/**
 * 为每门课的 teach/lessons 生成分步学习卡片索引页。
 * 输入：quartz/static/{课}/teach/lessons/*.html
 * 输出：content/{课}/分步学习.md
 *
 * 章节号提取优先级：
 *   1. HTML title 中的 "第 X 章"
 *   2. 文件名前缀前两位数字：0001 -> 0, 0301 -> 3
 *   3. 都没有 -> 0
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

function chapterNumber(title, filename) {
  // 1. 优先从 HTML title "第 X 章 · YYY" 提取
  const m1 = title.match(/第\s*(\d+)\s*章/)
  if (m1) return parseInt(m1[1], 10)
  // 2. 从文件名前缀前两位数字提取：0301-xxx.html -> 3
  const m2 = filename.match(/^(\d{2})/)
  if (m2) return parseInt(m2[1], 10)
  return 0
}

function lessonNumber(name) {
  const m = name.match(/^(\d+)/)
  return m ? m[1] : '???'
}

async function genCourse(course, site) {
  const src = path.join(site, 'quartz', 'static', course, 'teach')
  const lessonsDir = path.join(src, 'lessons')
  const out = path.join(site, 'content', course, '分步学习.md')

  await mkdir(path.dirname(out), { recursive: true })

  const lessons = []
  try {
    const files = await readdir(lessonsDir)
    for (const f of files) {
      if (!f.endsWith('.html')) continue
      const html = await readFile(path.join(lessonsDir, f), 'utf8')
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || f
      const ch = chapterNumber(title, f)
      lessons.push({ file: f, title, ch })
    }
  } catch {
    // no lessons dir — empty course, still generate
  }

  // 按章节分组
  const groups = new Map()
  for (const l of lessons.sort((a, b) => a.file.localeCompare(b.file, 'zh-CN', { numeric: true }))) {
    const key = String(l.ch)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(l)
  }

  // reference 页
  const refDir = path.join(src, 'reference')
  const refs = []
  try {
    const rfiles = await readdir(refDir)
    for (const f of rfiles) {
      if (!f.endsWith('.html')) continue
      const html = await readFile(path.join(refDir, f), 'utf8')
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || f
      refs.push({ file: f, title })
    }
  } catch {}

  // 生成 Markdown
  const urlBase = `/static/${encodeURIComponent(course)}/teach`
  const lines = []
  lines.push('---')
  lines.push(`title: 分步学习 · ${course}`)
  lines.push(`aliases:`)
  lines.push(`  - ${course}/分步学习`)
  lines.push('---')
  lines.push('')
  lines.push('<style>')
  lines.push(`
.stepper { max-width: 100%; margin-top: 1rem; }
.stepper-ch { margin: 1.2em 0 0.4em; padding: 0.25em 0; border-bottom: 1px solid var(--lightgray, #ddd); }
.stepper-ch h2 { margin: 0; font-size: 1.05em; color: var(--dark, #333); }
.stepper-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.6em; margin-top: 0.3em; }
.stepper-card {
  display: flex; flex-direction: column; gap: 0.2em;
  padding: 0.65em 0.8em; border: 1px solid var(--lightgray, #e0e0e0);
  border-radius: 6px; text-decoration: none; color: inherit;
  background: var(--light, #fff); transition: transform .12s ease, box-shadow .12s ease;
}
.stepper-card:hover { transform: translateY(-2px); box-shadow: 0 3px 10px rgba(0,0,0,.08); border-color: var(--secondary, #236b60); }
.stepper-num { font-size: 0.8em; color: var(--secondary, #236b60); font-weight: 600; letter-spacing: 0.02em; }
.stepper-title { font-size: 0.92em; line-height: 1.35; }
.stepper-meta { font-size: 0.72em; color: var(--darkgray, #888); margin-top: auto; }
.stepper-note { font-size: 0.78em; color: var(--darkgray, #777); margin: 0.1em 0 0.5em; }
.stepper-note a { color: var(--secondary, #236b60); text-decoration: underline; }
`)
  lines.push('</style>')
  lines.push('')
  lines.push('<div class="stepper">')

  for (const [chKey, entries] of groups) {
    const first = entries[0].title
    const chNum = parseInt(chKey, 10)
    // 判断本章节是否有显式 "第 X 章" 标题（用于生成章节副标题）
    const hasExplicitChapter = /第\s*\d+\s*章/.test(first)
    // 章节副标题：从首课 title 提取 "第 X 章 · YYY" 里的 YYY
    let chSubtitle = ''
    if (hasExplicitChapter) {
      chSubtitle = first.replace(/^第\s*\d+\s*章\s*[·.-]\s*/, '').trim()
    }
    const chHeading = chSubtitle ? `第 ${chNum} 章 · ${chSubtitle}` : `第 ${chNum} 章`

    lines.push(`<div class="stepper-ch">`)
    lines.push(`<h2>${chHeading}</h2>`)
    lines.push(`</div>`)
    lines.push(`<div class="stepper-grid">`)

    for (const e of entries) {
      const href = `${urlBase}/lessons/${encodeURIComponent(e.file)}`
      const num = lessonNumber(e.file).slice(-4)
      // 卡片标题：清理 "第 X 章 · " 和 "第 X 课 · " 前缀，保留正文
      const shortTitle = e.title
        .replace(/^第\s*\d+\s*章\s*[·.-]\s*/, '')
        .replace(/^第\s*\d+\s*课\s*[·.:-]\s*/, '')
        .trim()
      lines.push(`<a class="stepper-card" href="${href}">`)
      lines.push(`  <span class="stepper-num">${num}</span>`)
      lines.push(`  <span class="stepper-title">${shortTitle}</span>`)
      lines.push(`</a>`)
    }

    lines.push(`</div>`)
  }

  if (refs.length > 0) {
    lines.push(`<div class="stepper-ch"><h2>参考与速查</h2></div>`)
    lines.push(`<div class="stepper-grid">`)
    for (const r of refs) {
      const href = `${urlBase}/reference/${encodeURIComponent(r.file)}`
      lines.push(`<a class="stepper-card" href="${href}">`)
      lines.push(`  <span class="stepper-num">REF</span>`)
      lines.push(`  <span class="stepper-title">${r.title}</span>`)
      lines.push(`</a>`)
    }
    lines.push(`</div>`)
  }

  lines.push('</div>')
  lines.push('')
  await writeFile(out, lines.join('\n'), 'utf8')
  console.log(`分步学习 ${course}: ${lessons.length} lessons, ${refs.length} refs`)
}

export async function genAll(site) {
  const courses = ['物联网', '量子计算理论', 'OS', '计算机网络']
  for (const c of courses) await genCourse(c, site)
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const site = process.cwd()
  genAll(site).catch(e => { console.error(e); process.exit(1) })
}
