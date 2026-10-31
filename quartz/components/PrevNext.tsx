import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/prevNext.scss"
import { trieFromAllFiles } from "../util/ctx"
import { byCourseOrder } from "../util/courseOrder"
import { resolveRelative } from "../util/path"
import { classNames } from "../util/lang"

/**
 * 文章底部的「上一篇 / 下一篇」导航：在同一课程目录内，按课程章节顺序（byCourseOrder）
 * 指向前一篇和后一篇笔记。目录首页、标签页等列表页自动隐藏。
 */
export default (() => {
  const PrevNext: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const slug = fileData.slug!
    // 首页、文件夹页、标签页（slug 以 index 结尾）不显示
    if (slug === "index" || slug.endsWith("/index")) return null

    const trie = trieFromAllFiles(allFiles)
    const segments = slug.split("/")
    const folder = trie.findNode(segments.slice(0, -1))
    if (!folder) return null

    // 同目录下的笔记页（排除子文件夹），按章节顺序排序
    const pages = folder.children
      .filter((node) => !node.isFolder && node.data)
      .map((node) => node.data!)
      .sort(byCourseOrder)
    if (pages.length < 2) return null

    const idx = pages.findIndex((page) => page.slug === slug)
    if (idx === -1) return null
    const prev = idx > 0 ? pages[idx - 1] : undefined
    const next = idx < pages.length - 1 ? pages[idx + 1] : undefined
    if (!prev && !next) return null

    return (
      <nav class={classNames(displayClass, "prev-next")} aria-label="相邻笔记导航">
        {prev ? (
          <a class="prev-next-link prev" href={resolveRelative(slug, prev.slug)}>
            <span class="prev-next-direction">← 上一篇</span>
            <span class="prev-next-title">{prev.title}</span>
          </a>
        ) : (
          <span class="prev-next-spacer" />
        )}
        {next ? (
          <a class="prev-next-link next" href={resolveRelative(slug, next.slug)}>
            <span class="prev-next-direction">下一篇 →</span>
            <span class="prev-next-title">{next.title}</span>
          </a>
        ) : (
          <span class="prev-next-spacer" />
        )}
      </nav>
    )
  }

  PrevNext.css = style
  return PrevNext
}) satisfies QuartzComponentConstructor
