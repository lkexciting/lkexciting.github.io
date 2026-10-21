import { readdir, readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
async function countNotes(dir) {
  let count = 0
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    if (!entry.isDirectory()) assetNames.add(entry.name)
    count += entry.isDirectory() ? await countNotes(path.join(dir, entry.name)) : Number(entry.name.endsWith('.md'))
  }
  return count
}
async function normalizeRelativeLinks(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) { await normalizeRelativeLinks(file); continue }
    if (!entry.name.endsWith('.md')) continue
    const source = await readFile(file, 'utf8')
    // Quartz resolves paths from content root. Convert explicit relative Markdown
    // paths in the publish copy; leave the original Obsidian file untouched.
    const normalized = source.replace(/!\[\[([^\]|]+\.(?:png|jpe?g|gif|webp|svg))(?:\|[^\]]*)?\]\]/gi, (match, name) => assetNames.has(path.basename(name)) ? match : `【原笔记缺少图片：${name}】`).replace(/\]\(<?(\.\.?\/[^)>]+)>?\)/g, (match, url) => {
      const [target, ...anchor] = url.split('#')
      let decoded
      try { decoded = decodeURIComponent(target) } catch { return match }
      const absolute = path.resolve(path.dirname(file), decoded)
      const relative = path.relative(path.join(site, 'content'), absolute)
      if (relative.startsWith('..') || path.isAbsolute(relative)) return match
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
  await cp(path.join(vault, name), dest, { recursive: true, filter: source => !path.basename(source).startsWith('.') })
  await normalizeRelativeLinks(dest)
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




