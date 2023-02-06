type ExtractResult = {
  match: string
  filename: string
  alt?: string
  title?: string
}

export function extractImages(str: string): ExtractResult[] {
  const result: ExtractResult[] = []

  const regex =
    // eslint-disable-next-line no-useless-escape
    /!\[(?<alt>[^\]]*)\]\((?<filename>.*?)(?=\"|\))(?<title>\".*\")?\)/g

  // Alternative syntax using RegExp constructor
  // const regex = new RegExp('!\\[[^\\]]*\\]\\((?<filename>.*?)(?=\\"|\\))(?<optionalpart>\\".*\\")?\\)', 'g')
  let m

  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }

    const {filename, alt, title} = m.groups as {
      filename: string
      alt?: string
      title?: string
    }

    result.push({
      match: m[0],
      filename: filename.trim(),
      alt,
      title: stripQuotes(title)
    })
  }

  return result
}

function stripQuotes(str?: string): string | undefined {
  if (!str) {
    return str
  }
  const isQuoted = str.startsWith('"') && str.endsWith('"')
  return isQuoted ? str.slice(1, str.length - 1) : str
}
