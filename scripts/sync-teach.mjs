import { readdir, readFile, writeFile, cp, mkdir, access } from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'

export async function syncTeach(site) {
  const root = process.env.TEACH_DIR || 'D:/学习文件/大三上/teach'
  const mappings = [['计算机网络','计算机网络'],['OS','OS'],['量子计算理论基础与软件系统','量子计算理论'],['物联网技术基础与应用开发','物联网']]
  for (const [source, course] of mappings) {
    const src = path.join(root, source)
    await access(src)
    const dest = path.join(site, 'content', course, 'teach')
    await mkdir(dest, { recursive: true })
    const sections = new Map()
    async function copy(dir, relative = '') {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || ['node_modules','tools','learning-records','课件'].includes(entry.name)) continue
        const rel = path.join(relative, entry.name === 'index.html' ? 'course-index.html' : entry.name)
        if (entry.isDirectory()) { await copy(path.join(dir,entry.name),rel); continue }
        if (/^(MISSION|NOTES|RESOURCES)\.md$/i.test(entry.name)) continue
        const target = path.join(dest,rel)
        await mkdir(path.dirname(target),{recursive:true})
        await cp(path.join(dir,entry.name),target)
        if (/\.html$/i.test(entry.name) && relative.split(path.sep)[0] !== 'assets') {
          const html = (await readFile(target,'utf8')).replace(/<a\b[^>]*href=["']([^"']+\.md)["'][^>]*>([\s\S]*?)<\/a>/gi,(match,url,label)=>{
            if (/^(?:https?:)/i.test(url)) return match
            if (!existsSync(path.resolve(dir,url)) || /(?:MISSION|NOTES|RESOURCES)\.md$/i.test(url)) return label
            return match.replace(url,url.replace(/\.md$/,'.html'))
          }).replace(/(href=["'](?:\.\.\/|\.\/)*)(index\.html)(["'#])/gi,'$1course-index.html$3')
          await writeFile(target,html,'utf8')
          const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || entry.name
          const group = relative.split(path.sep)[0] || '课程导航'
          if (!sections.has(group)) sections.set(group,[])
          sections.get(group).push({rel:rel.split(path.sep).join('/'),title})
        }
      }
    }
    await copy(src)
    // A separate Markdown entry avoids overwriting standalone index.html pages.
    const lines = ['---','title: 课件精讲','---','','按课时阅读，包含原有公式、图示与交互演示。','']
    for(const [group,entries] of sections) {
      lines.push('## '+({lessons:'课时讲解',reference:'参考与速查',homework:'练习'}[group] || group),'')
      for(const entry of entries.sort((a,b)=>a.rel.localeCompare(b.rel,'zh-CN',{numeric:true}))) {
        const href = '/'+[course,'teach',...entry.rel.split('/')].map(encodeURIComponent).join('/')
        lines.push(`<p><a href="${href}">${entry.title.replaceAll('&','&amp;').replaceAll('<','&lt;')}</a></p>`)
      }
    }
    await writeFile(path.join(site,'content',course,'课件精讲.md'),lines.join('\n'),'utf8')
    console.log(`teach ${course}: ${[...sections.values()].reduce((n,a)=>n+a.length,0)} HTML pages`)
  }
}
