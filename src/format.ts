export function formatFrontMatterValue(
  value: unknown,
  valueWithoutDateProcessing: unknown
): string {
  if (typeof value === 'object' && value instanceof Date) {
    return valueWithoutDateProcessing as string
  } else if (Array.isArray(value)) {
    return `\n${value
      .map(
        (line, index) =>
          `  - ${formatFrontMatterValue(
            line,
            (valueWithoutDateProcessing as unknown[])[index]
          )}`
      )
      .join('\n')}`
  } else {
    return `"${value}"`
  }
}
