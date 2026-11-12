export function fixBoldBoundaries(text) {
  return text.replace(/(```[^\n]*\n[\s\S]*?```|~~~[^\n]*\n[\s\S]*?~~~|`+[^`\n]*`+|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)|(\*\*[^*\n]+\*\*)(?=[\u3400-\u9fff])/g, (all, protectedPart, bold) => protectedPart || bold + ' ')
}
