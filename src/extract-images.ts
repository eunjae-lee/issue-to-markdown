type ExtractResult = {
  match: string
  filename: string
  alt?: string
  title?: string
}

export function extractImages(str: string): ExtractResult[] {
  const result: ExtractResult[] = []

  const regex = /!\[([^\]]*)\]\((.*?)\s*(('|")(?:.*[^"])('|"))?\s*\)/g

  // Alternative syntax using RegExp constructor
  // const regex = new RegExp('!\\[[^\\]]*\\]\\((?<filename>.*?)(?=\\"|\\))(?<optionalpart>\\".*\\")?\\)', 'g')
  let m

  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }

    const [match, alt, filename, title] = m

    result.push({
      match,
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
  const quotes = [`'`, `"`]
  const isQuoted =
    quotes.includes(str[0]) && quotes.includes(str[str.length - 1])
  return isQuoted ? str.slice(1, str.length - 1) : str
}
