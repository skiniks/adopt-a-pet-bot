import he from 'he'

export function decodeHtmlEntities(text: string) {
  return he.decode(text)
}
