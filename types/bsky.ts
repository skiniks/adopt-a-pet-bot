export interface BskyImage {
  alt: string
  image: {
    $type: 'blob'
    ref: { $link: string }
    mimeType: string
    size: number
  }
}

export interface BskyBlob {
  ref: { $link: string }
  mimeType: string
  size: number
}
