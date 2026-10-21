/** Normalize Obsidian display math so Markdown parsers cannot treat TeX as fence metadata. */
export function normalizeMathBlocks(source: string): string {
  const output: string[] = []
  let inMath = false
  let fence: { char: string; length: number } | undefined
  for (const line of source.split(/\r?\n/)) {
    const codeFence = line.match(/^\s*(`{3,}|~{3,})/)
    if (!inMath && codeFence) {
      const marker = codeFence[1]
      if (!fence) fence = { char: marker[0], length: marker.length }
      else if (marker[0] === fence.char && marker.length >= fence.length) fence = undefined
      output.push(line)
      continue
    }
    if (fence) {
      output.push(line)
      continue
    }
    if (!inMath) {
      const opening = line.match(/^(\s*)\$\$(.*)$/)
      if (!opening) {
        output.push(line)
        continue
      }
      const [, indent, body] = opening
      output.push(`${indent}$$`)
      const closing = body.search(/(?<!\\)\$\$/)
      if (closing < 0) {
        if (body) output.push(indent + body)
        inMath = true
      } else {
        output.push(indent + body.slice(0, closing), `${indent}$$`)
        if (body.slice(closing + 2).trim()) output.push("", body.slice(closing + 2))
      }
    } else {
      const closing = line.search(/(?<!\\)\$\$/)
      if (closing < 0) output.push(line)
      else {
        if (line.slice(0, closing).trim()) output.push(line.slice(0, closing))
        output.push("$$")
        if (line.slice(closing + 2).trim()) output.push("", line.slice(closing + 2))
        inMath = false
      }
    }
  }
  return output.join("\n")
}
