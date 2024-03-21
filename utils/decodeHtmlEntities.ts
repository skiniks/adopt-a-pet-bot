import he from 'he'

export function decodeHtmlEntities(text) {
  return he.decode(text)
}
