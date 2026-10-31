import { readdir, readFile, writeFile, mkdir, cp, rm, rename } from 'node:fs/promises'
import matter from 'gray-matter'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { convertImagesToWebp, applyContentUpgrades, cleanNoteTitle } from './note-transforms.mjs'

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const vault = path.resolve(site, '..')
const courses = [
  ['计算机网络', 'NETWORKS', '从分层模型到网络协议，理解信息如何连接。'],
  ['计算机系统原理', 'COMPUTER SYSTEMS', '从硬件到程序，探索计算机的工作方式。'],
  ['OS', 'OPERATING SYSTEMS', '进程、内存与文件系统，理解系统的组织。'],
  ['OOP', 'OBJECT ORIENTED', '对象、抽象与泛型，整理程序设计的思路。'],
  ['图像信息处理', 'IMAGE PROCESSING', '从像素到特征，探索图像背后的方法。'],
  ['量子计算理论', 'QUANTUM COMPUTING', '量子态、量子门与量子计算的基础。'],
  ['物联网', 'INTERNET OF THINGS', '感知、通信与连接，记录物联网学习。'],
]
const assetNames = new Set()
const notePaths = new Set()
const isCourseNote = file => path.extname(file).toLowerCase() === '.md' && path.relative(vault, path.dirname(file)).split(path.sep).some(part => /^notes?$/i.test(part))
async function countNotes(dir) {
  let count = 0
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    if (!entry.isDirectory()) assetNames.add(entry.name)
    if (isCourseNote(path.join(dir, entry.name))) notePaths.add(path.resolve(dir, entry.name))
    count += entry.isDirectory() ? await countNotes(path.join(dir, entry.name)) : Number(isCourseNote(path.join(dir, entry.name)))
  }
  return count
}
async function flattenPublishedNotes(courseDir, courseName) {
  const entries = []
  async function collect(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) await collect(file)
      else if (entry.name.endsWith('.md')) entries.push(file)
    }
  }
  await collect(courseDir)
  const targets = new Set()
  for (const file of entries) {
    const relative = path.relative(courseDir, file)
    const target = path.join(courseDir, ...relative.split(path.sep).filter(part => !/^notes?$/i.test(part)))
    if (targets.has(target.toLowerCase())) throw new Error(`展平后文件重名：${target}`)
    targets.add(target.toLowerCase())
  }
  for (const file of entries) {
    const relative = path.relative(courseDir, file)
    const target = path.join(courseDir, ...relative.split(path.sep).filter(part => !/^notes?$/i.test(part)))
    const parsed = matter(await readFile(file, 'utf8'))
    parsed.data.title = cleanNoteTitle(file, courseName)
    const aliases = parsed.data.aliases ?? parsed.data.alias ?? []
    parsed.data.aliases = [...new Set([...(Array.isArray(aliases) ? aliases : [aliases]), `${courseName}/${relative.split(path.sep).join('/').replace(/\.md$/, '')}`])]
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(file, matter.stringify(parsed.content, parsed.data), 'utf8')
    if (file !== target) await rename(file, target)
  }
  // Keep old folder URLs working without retaining a notes layer in navigation.
  await writeFile(path.join(courseDir, 'index.md'), matter.stringify('', {
    title: courseName,
    aliases: [`${courseName}/notes/index`, `${courseName}/note/index`],
  }), 'utf8')
}
async function normalizeRelativeLinks(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) { await normalizeRelativeLinks(file); continue }
    if (!entry.name.endsWith('.md')) continue
    const source = await readFile(file, 'utf8')
    // Quartz resolves paths from content root. Convert explicit relative Markdown
    // paths in the publish copy; leave the original Obsidian file untouched.
    const normalized = source.replace(/!\[\[([^\]|]+\.(?:png|jpe?g|gif|webp|svg))(?:\|[^\]]*)?\]\]/gi, (match, name) => assetNames.has(path.basename(name)) ? match : `【原笔记缺少图片：${name}】`).replace(/(?<!!)\[\[([^\]|#]+)(#[^\]|]*)?(\|[^\]]*)?\]\]/g, (match, target, anchor = '', alias = '') => {
      const note = target.endsWith('.md') ? target : `${target}.md`
      const original = path.resolve(vault, path.relative(path.join(site, 'content'), path.dirname(file)), note)
      if (!notePaths.has(original)) return match
      const published = path.relative(vault, original).split(path.sep).filter(part => !/^notes?$/i.test(part)).join('/').replace(/\.md$/, '')
      return `[[${published}${anchor}${alias || '|' + target}]]`
    }).replace(/\]\(<?([^)>]+)>?\)/g, (match, url) => {
      if (/^(?:[a-z]+:|#|\/)/i.test(url) || (!url.startsWith('.') && !/\.md(?:#.*)?$/.test(url))) return match
      const [target, ...anchor] = url.split('#')
      let decoded
      try { decoded = decodeURIComponent(target) } catch { return match }
      const absolute = path.resolve(path.dirname(file), decoded)
      let relative = path.relative(path.join(site, 'content'), absolute)
      if (relative.startsWith('..') || path.isAbsolute(relative)) return match
      if (/\.md$/i.test(decoded)) relative = relative.split(path.sep).filter(part => !/^notes?$/i.test(part)).join(path.sep)
      return `](${relative.split(path.sep).map(encodeURIComponent).join('/')}${anchor.length ? '#' + anchor.join('#') : ''})`
    })
    if (source !== normalized) await writeFile(file, normalized, 'utf8')
  }
}
// Validate all sources before changing the generated course copies.
const counts = await Promise.all(courses.map(([name]) => countNotes(path.join(vault, name))))
for (const [name] of courses) {
  const dest = path.resolve(site, 'content', name)
  if (!dest.startsWith(path.resolve(site, 'content') + path.sep)) throw new Error('同步目标超出 content 目录')
  await rm(dest, { recursive: true, force: true })
  await cp(path.join(vault, name), dest, { recursive: true, filter: source => !path.basename(source).startsWith('.') && (path.extname(source).toLowerCase() !== '.md' || isCourseNote(source)) })
  // 图片先转 WebP，后续改写引用时只引用转换成功的文件
  const converted = await convertImagesToWebp(dest)
  await normalizeRelativeLinks(dest)
  // 高亮语法修复、图片引用改写、列表结构升级（原始笔记不受影响）
  await applyContentUpgrades(dest, converted)
  await flattenPublishedNotes(dest, name)
}
const total = counts.reduce((a, b) => a + b, 0)
const cards = courses.map(([name, label, desc], i) => `<div class="course-card"><span class="course-label">${String(i + 1).padStart(2, '0')} / ${label}</span><h3><a class="internal" href="./${name}/">${name}</a></h3><p>${desc}</p><span class="course-count">${counts[i]} 篇笔记 <span aria-hidden="true">↗</span></span></div>`).join('\n')
await mkdir(path.join(site, 'content'), { recursive: true })
await writeFile(path.join(site, 'content', 'index.md'), `---
title: 学习，是不断建立连接。
description: lkexciting 的课程笔记与知识花园，记录计算机科学与量子计算的学习。
---

<div class="garden-intro"><span class="eyebrow">LKEXCITING / DIGITAL GARDEN</span><p class="garden-lead">把零散的理解，慢慢连成自己的知识地图。</p><p>这里收录我的课程笔记与学习记录。沿着目录阅读，也可以从搜索开始，发现知识之间的联系。</p><div class="garden-stats"><span><strong>${String(courses.length).padStart(2, '0')}</strong> 个学习方向</span><span><strong>${total}</strong> 篇课程笔记</span><span class="growing">持续生长中</span></div></div>

## 探索笔记

<div class="course-grid">
${cards}
</div>

## 关于这个笔记本

记录学习过程中值得留下的概念、推导和问题。内容可能仍在完善，欢迎交流与指正。

> [!tip] 从哪里开始？
> 选择上方的课程卡片，或打开左侧笔记目录。搜索支持按标题和正文查找，文章中的内部链接可以悬浮预览。
`, 'utf8')
console.log(`已同步 ${courses.length} 个课程文件夹，${total} 篇笔记。原始笔记未修改。`)




