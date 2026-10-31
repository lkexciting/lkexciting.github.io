// 笔记内容升级转换：同步脚本与本地重建共用同一套逻辑，保证行为一致。
// 每个函数都必须是幂等且安全的：对已经转换过的内容再次执行不会产生变化。

import { readdir, readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
/**
 * Q1：修复 Obsidian 高亮语法在 Quartz 中的失效问题。
 * Quartz 的高亮替换只作用于文本节点，`==**术语**==` 会被解析成
 * “==文本 + strong节点 + ==文本”而凑不齐一对，导致高亮完全不渲染。
 * 交换嵌套顺序为 `**==术语==**` 后替换即可生效（.text-highlight 样式自带）。
 * 已经是 `**==X==**` 或普通 `==X==` 的内容不受影响。
 */
export function fixHighlightSyntax(md) {
  return md.replace(/==\*\*([^*]+?)\*\*==/g, '**==$1==**')
}

/**
 * Q3：把「加粗列表当标题」的老结构升级为标准 Markdown 标题。
 * 仅转换满足以下全部条件的文件，避免误伤：
 *   1. 全文没有任何 `#` 标题（已用标题组织的文件不动）；
 *   2. 顶层列表项整行只有加粗文本（`- **章节名**`）；
 *   3. 该列表项带有缩进子项（说明它是章节而不是术语表条目）。
 * 转换后子项块统一减少一级缩进（行首空白按 4 空格折 1 tab 规范化）。
 */
export function upgradeListStructure(md) {
  const lines = md.split('\n')
  if (lines.some((line) => /^#{1,6}\s/.test(line))) return md

  const out = []
  let i = 0
  let changed = false
  while (i < lines.length) {
    const line = lines[i]
    const match = line.match(/^[-*] \*\*([^*]+)\*\*\s*$/)
    if (match) {
      const blockEnd = collectIndentedBlock(lines, i + 1)
      if (blockEnd > i + 1) {
        out.push(`## ${match[1].trim()}`)
        for (let k = i + 1; k < blockEnd; k++) out.push(dedentOneLevel(lines[k]))
        changed = true
        i = blockEnd
        continue
      }
    }
    out.push(line)
    i += 1
  }
  return changed ? out.join('\n') : md
}

// 收集从 start 开始的缩进块；块内允许空行，但空行之后必须还是缩进内容
function collectIndentedBlock(lines, start) {
  let j = start
  while (j < lines.length) {
    if (/^[\t ]+\S/.test(lines[j])) {
      j += 1
      continue
    }
    if (lines[j].trim() === '') {
      let k = j + 1
      while (k < lines.length && lines[k].trim() === '') k += 1
      if (k < lines.length && /^[\t ]+\S/.test(lines[k])) {
        j = k
        continue
      }
    }
    break
  }
  return j
}

// 行首空白按 4 空格 = 1 tab 规范化后去掉一级
function dedentOneLevel(line) {
  const match = line.match(/^[\t ]+/)
  if (!match) return line
  let width = 0
  for (const ch of match[0]) width += ch === '\t' ? 4 : 1
  const tabs = Math.max(0, Math.floor(width / 4) - 1)
  const rest = width % 4
  return '\t'.repeat(tabs) + ' '.repeat(rest) + line.slice(match[0].length)
}

/**
 * Q6：由文件名生成干净的显示标题。
 * - 去掉编号前缀（01-xxx、01.xxx、01 xxx）
 * - Chapter3 规范为 Chapter 3
 * - 去掉与课程文件夹重复的前缀（计算机系统原理 第五章… → 第五章…）
 * - AI 精讲笔记统一标记为「· AI 精讲」：兼容 `_ai` 后缀与「 AI精讲」后缀两种命名
 */
export function cleanNoteTitle(filename, courseName = '') {
  const raw = path.basename(filename, '.md')
  const isAi = /_ai$/i.test(raw) || /\s*AI\s*精讲$/i.test(raw)
  const base = raw
    .replace(/_ai$/i, '')
    .replace(/\s*AI\s*精讲$/i, '')
    .replace(/^\d+[-.\s]+/, '')
    .replace(/^Chapter\s*(\d+)/i, 'Chapter $1')
    .replace(/\s+/g, ' ')
    .trim()
  let title = base
  if (courseName && title.startsWith(courseName)) {
    title = title.slice(courseName.length).replace(/^[\s·\-—–:：]+/, '')
  }
  title = title.trim()
  // 去掉课程名前缀后为空（标题就是课程名）时回退到清理后的基础标题
  if (!title) title = base
  if (isAi) title = `${title} · AI 精讲`
  return title
}

/**
 * Q2：把目录下的 PNG/JPG 批量转换为 WebP（教材截图类图片通常能压到 1/5）。
 * 返回成功转换的文件名集合（含 .webp 扩展名），供改写引用使用。
 * 转换成功后删除原文件：引用会被改写成 .webp，原文件留着只是浪费仓库体积。
 * 单个文件失败只警告不中断，保留原格式引用。
 */
export async function convertImagesToWebp(dir, { quality = 80 } = {}) {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.warn('未安装 sharp，跳过 WebP 转换（npm install 后生效）。')
    return new Set()
  }
  const converted = new Set()
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(file)
        continue
      }
      const ext = path.extname(entry.name).toLowerCase()
      if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue
      const webpFile = `${file.slice(0, -ext.length)}.webp`
      try {
        await sharp(file).webp({ quality }).toFile(webpFile)
        await rm(file)
        converted.add(`${entry.name.slice(0, -ext.length)}.webp`)
      } catch (err) {
        console.warn(`WebP 转换失败，保留原格式：${entry.name}（${err.message}）`)
      }
    }
  }
  await walk(dir)
  return converted
}

/**
 * Q2：把 Markdown 中的图片引用改写成 WebP。
 * 覆盖两种写法：Obsidian 的 ![[name.png]]（可带 |宽度）和标准的 ![alt](path.png)。
 * 只有确认转换成功的文件才会被改写，其余保持原样。
 */
export function rewriteImageRefs(md, converted) {
  if (!converted || converted.size === 0) return md
  // converted 里存的是转换后的 .webp 文件名，先把候选引用换成 .webp 再查表
  const isConverted = (name) => {
    try {
      name = decodeURIComponent(name)
    } catch {
      /* 保留原始字符串 */
    }
    return converted.has(path.basename(name).replace(/\.(?:png|jpe?g)$/i, '.webp'))
  }
  return md
    .replace(/!\[\[([^\]|]+\.(?:png|jpe?g))((?:\|[^\]]*)?)\]\]/gi, (match, name, size) =>
      isConverted(name)
        ? `![[${name.replace(/\.(?:png|jpe?g)$/i, '.webp')}${size}]]`
        : match,
    )
    .replace(/!\[([^\]]*)\]\(<?([^)>\s]+\.(?:png|jpe?g))>?\)/gi, (match, alt, url) =>
      isConverted(url) ? `![${alt}](${url.replace(/\.(?:png|jpe?g)$/i, '.webp')})` : match,
    )
}

/**
 * 视觉排版：中西文混排加空格（盘古之白），并清理全角标点前后的多余空格。
 * 幂等；自动跳过代码块、行内代码、数学公式、维基链接、Markdown 链接地址和 HTML 标签，
 * 不会改动任何路径、代码与公式内容。
 */
const CJK = '\\u4e00-\\u9fff\\u3400-\\u4dbf'
// 行内保护片段：行内代码、数学公式、维基链接/图片嵌入、链接地址、HTML 标签
const PROTECTED_SEGMENT =
  /`[^`]*`|\$\$[^$]*\$\$|\$[^$\n]*\$|!?\[\[[^\]]*\]\]|\]\([^)]*\)|<[^>]+>/g

export function fixCjkSpacing(md) {
  const spaceLine = (line) => {
    const tokens = []
    const shielded = line.replace(PROTECTED_SEGMENT, (seg) => {
      tokens.push(seg)
      return `\u0000${tokens.length - 1}\u0000`
    })
    const spaced = shielded
      // 全角标点前不留空格（如「world ？」→「world？」）
      .replace(/ +([，。？！：；、）】》」』])/g, '$1')
      // 前引号/前括号类全角标点后不留空格
      .replace(/([（【《「『]) +/g, '$1')
      // 中文与拉丁字母、数字之间加空格
      .replace(new RegExp(`([${CJK}])([A-Za-z0-9])`, 'g'), '$1 $2')
      .replace(new RegExp(`([A-Za-z0-9])([${CJK}])`, 'g'), '$1 $2')
    return spaced.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[Number(i)])
  }

  const lines = md.split('\n')
  let inFence = false
  let inMathBlock = false
  const out = lines.map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      return line
    }
    if (inFence) return line
    // 含 $$ 的行整行按公式处理；奇数个 $$ 切换多行公式块状态
    const mathDelims = (line.match(/\$\$/g) || []).length
    if (mathDelims > 0) {
      if (mathDelims % 2 === 1) inMathBlock = !inMathBlock
      return line
    }
    if (inMathBlock) return line
    return spaceLine(line)
  })
  return out.join('\n')
}

/**
 * 清理失效的图片嵌入：引用的文件不在素材集合里时直接移除（原笔记不受影响）。
 */
export function dropBrokenImageEmbeds(md, knownAssets) {
  if (!knownAssets || knownAssets.size === 0) return md
  return md.replace(
    /!?\[\[([^\]|]+\.(?:png|jpe?g|gif|webp|svg))(?:\|[^\]]*)?\]\]/gi,
    (match, name) => {
      try {
        name = decodeURIComponent(name)
      } catch {
        /* 保留原始字符串 */
      }
      return knownAssets.has(path.basename(name)) ? match : ''
    },
  )
}

/**
 * 收集目录下所有非 Markdown 素材文件的文件名（basename）集合。
 */
export async function collectAssetNames(dir) {
  const names = new Set()
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(file)
        continue
      }
      if (!entry.name.endsWith('.md')) names.add(entry.name)
    }
  }
  await walk(dir)
  return names
}

/**
 * 对目录下所有笔记应用内容升级（高亮修复 + 图片引用改写 + 失效嵌入清理 +
 * 结构转换 + 中西文排版）。frontmatter 单独保护，不参与正文转换。
 */
export async function applyContentUpgrades(dir, converted = new Set()) {
  const assets = await collectAssetNames(dir)
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await walk(file)
        continue
      }
      if (!entry.name.endsWith('.md')) continue
      const original = await readFile(file, 'utf8')
      const upgraded = await upgradeMarkdown(original, converted, assets)
      if (upgraded !== original) await writeFile(file, upgraded, 'utf8')
    }
  }
  await walk(dir)
}

/**
 * 单篇笔记的完整转换管线（正文部分）；frontmatter 原样保留。
 */
export async function upgradeMarkdown(original, converted = new Set(), assets = new Set()) {
  let matter
  try {
    matter = (await import('gray-matter')).default
  } catch {
    matter = null
  }
  const transform = (body) =>
    fixCjkSpacing(
      upgradeListStructure(dropBrokenImageEmbeds(rewriteImageRefs(fixHighlightSyntax(body), converted), assets)),
    )
  if (!matter) return transform(original)
  const parsed = matter(original)
  const body = transform(parsed.content)
  return body === parsed.content ? original : matter.stringify(body, parsed.data)
}
