import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { getStudyContent } from "../util/learning"
import { classNames } from "../util/lang"
import style from "./styles/learning.scss"

interface StudyGuideOptions {
  showDefaultPrompts: boolean
}

const defaultOptions: StudyGuideOptions = { showDefaultPrompts: true }

/**
 * 复习与自测：优先展示作者在 frontmatter 中写的 study_prompts / study / pitfalls；
 * 未填写时显示通用复习方法，可用 study_guide: false 对单篇关闭。
 */
export default ((userOpts?: Partial<StudyGuideOptions>) => {
  const opts = { ...defaultOptions, ...userOpts }
  const StudyGuide: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const slug = fileData.slug!
    if (slug === "index" || slug.endsWith("/index")) return null
    if (fileData.frontmatter?.study_guide === false) return null

    const study = getStudyContent(fileData)
    if (!opts.showDefaultPrompts && !study.customized) return null
    if (study.prompts.length === 0 && study.pitfalls.length === 0) return null

    return (
      <section class={classNames(displayClass, "study-guide")} aria-labelledby="study-guide-title">
        <h2 id="study-guide-title" class="learning-title">
          复习与自测
        </h2>
        {study.prompts.length > 0 && (
          <ol class="study-prompts">
            {study.prompts.map((prompt) => (
              <li>{prompt}</li>
            ))}
          </ol>
        )}
        {study.pitfalls.length > 0 && (
          <div class="study-pitfalls">
            <h3>我的易错点</h3>
            <ul>
              {study.pitfalls.map((pitfall) => (
                <li>{pitfall}</li>
              ))}
            </ul>
          </div>
        )}
        {!study.customized && (
          <p class="study-customize-hint">
            可在笔记 frontmatter 中用 <code>study_prompts</code> 添加自测题，用{" "}
            <code>pitfalls</code> 记录自己的易错点。
          </p>
        )}
      </section>
    )
  }
  StudyGuide.css = style
  return StudyGuide
}) satisfies QuartzComponentConstructor
