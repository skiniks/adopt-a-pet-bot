import type { At } from '@atcute/client/lexicons'

export interface BskyImage {
  alt: string
  image: {
    $type: 'blob'
    ref: { $link: string }
    mimeType: string
    size: number
  }
}

export type BskyBlob = At.Blob
