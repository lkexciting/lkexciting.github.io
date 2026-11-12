import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { fixBoldBoundaries } from './os-bold-boundaries.mjs'
import { cleanNoteTitle } from './note-transforms.mjs'
const vault=path.resolve('..','OS'), dest=path.resolve('content','OS')
const chapters=Array.from({length:9},(_,i)=>`Chapter ${i+1}`)
chapters.splice(5,0,'Chapter 5-1')
const linux=['Linux概述','Linux内核','Linux内核模块','Linux系统调用','Linux进程管理','Linux内存管理'].map((v,i)=>`L${i+1} ${v}`)
const stems=[...chapters,...linux,'OS学习索引']
const naming=JSON.parse(await fs.readFile('scripts/note-names.json','utf8'))
const extra={'Chapter 5-1':'第 5-1 章 · Windows 与 Linux 调度实现','Chapter 8':'第 8 章 · 主存管理','Chapter 9':'第 9 章 · 虚拟内存','OS学习索引':'OS 学习索引'}
const titles=new Map(stems.map(s=>[s,extra[s]||cleanNoteTitle(s+'.md','OS')]))
const sources=new Map();for(const s of stems)sources.set(s,await fs.readFile(path.join(vault,'notes',s+'.md'),'utf8'))
const assets=new Map()
async function inventory(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await inventory(p);else assets.set(e.name,p)}}
await inventory(path.join(vault,'pictures'))
let images=0
for(const [stem,raw] of sources){
 const title=titles.get(stem), m=matter(raw), target=path.join(dest,title+'.md')
 let existing={};try{existing=matter(await fs.readFile(target,'utf8')).data}catch{}
 const aliases=[...(existing.aliases||[]),...(m.data.aliases||[]),`OS/${stem}`,`OS/notes/${stem}`]
 m.data={...m.data,title,aliases:[...new Set(aliases)].filter(a=>a!==`OS/${title}`)}
 const converted=async (url)=>{
  if(!url.startsWith('../pictures/'))return url
  const src=path.resolve(vault,'notes',decodeURIComponent(url)),relative=path.relative(vault,src)
  if(relative.startsWith('..'))throw Error('image outside OS '+src)
  const output=path.join(dest,relative);await fs.mkdir(path.dirname(output),{recursive:true});await fs.copyFile(src,output);images++
  return 'OS/'+relative.split(path.sep).map(encodeURIComponent).join('/')
 }
 let body=fixBoldBoundaries(m.content)
 for(const match of [...body.matchAll(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)]){
  const src=assets.get(path.basename(match[1]));if(!src)throw Error('Missing embedded image '+match[1])
  const rel=path.relative(vault,src);const output=path.join(dest,rel);await fs.mkdir(path.dirname(output),{recursive:true});await fs.copyFile(src,output);images++
  body=body.replace(match[0],`![${path.basename(match[1])}](OS/${rel.split(path.sep).map(encodeURIComponent).join('/')})`)
 }
 for(const match of [...body.matchAll(/!\[([^\]]*)\]\(<?([^)>]+)>?\)/g)])body=body.replace(match[0],`![${match[1]}](${await converted(match[2])})`)
 body=body.replace(/(?<!!)\[\[([^\]|#]*)(#[^\]|]*)?(?:\|([^\]]*))?\]\]/g,(all,t,anchor='',label)=>{
  if(!t)return all
  const base=path.basename(t.replace(/\.md$/,''));if(!titles.has(base))return all
  return `[[OS/${titles.get(base)}${anchor}|${label||base}]]`
 })
 body=body.replace(/^# .+$/m,'# '+title)
 if(stem==='OS学习索引')body=body.replace(/^修改前的 Chapter 1–7 已备份到.*$/m,'')
 m.content=body;await fs.writeFile(target,matter.stringify(body,m.data));naming['OS/'+stem]=title
}
const entry=matter(await fs.readFile(path.join(dest,titles.get('OS学习索引')+'.md'),'utf8'))
entry.data={title:'OS',aliases:['OS/notes/index','OS/note/index']};await fs.writeFile(path.join(dest,'index.md'),matter.stringify(entry.content,entry.data))
await fs.writeFile('scripts/note-names.json',JSON.stringify(naming,null,2)+'\n')
console.log(`OS synced ${stems.length} notes, ${images} image references`)
