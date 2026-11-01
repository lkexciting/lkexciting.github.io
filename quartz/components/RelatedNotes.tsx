import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { getRelatedNotes } from "../util/learning"
import { FullSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"
import style from "./styles/learning.scss"

interface RelatedNotesOptions {
  limit: number
}

const defaultOptions: RelatedNotesOptions = { limit: 3 }

/** 正文末尾的跨章节/跨课程相关阅读；没有可靠关联时不渲染空卡片。 */
export default ((userOpts?: Partial<RelatedNotesOptions>) => {
  const opts = { ...defaultOptions, ...userOpts }
  const RelatedNotes: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
  }: QuartzComponentProps) => {
    const related = getRelatedNotes(fileData, allFiles, opts.limit)
    if (related.length === 0) return null

    return (
      <section
        class={classNames(displayClass, "related-notes")}
        aria-labelledby="related-notes-title"
      >
        <h2 id="related-notes-title" class="learning-title">
          相关笔记
        </h2>
        <ul class="related-notes-list">
          {related.map((note) => (
            <li>
              <a
                class="internal related-note-link"
                href={resolveRelative(fileData.slug!, note.slug! as FullSlug)}
              >
                <span class="related-note-course">{note.slug!.split("/")[0]}</span>
                <span class="related-note-title">{note.frontmatter?.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    )
  }
  RelatedNotes.css = style
  return RelatedNotes
}) satisfies QuartzComponentConstructor
