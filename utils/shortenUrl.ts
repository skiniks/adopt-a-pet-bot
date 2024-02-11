export function shortenUrl(url: string, delimiter: string): string {
  const endIndex = url.indexOf(delimiter)
  return endIndex !== -1 ? url.substring(0, endIndex) : url
}
