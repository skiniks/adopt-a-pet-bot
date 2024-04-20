import { Buffer } from 'node:buffer'

export async function getImageAsBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.statusText}`)

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer
  }
  catch (err) {
    console.error('Error fetching the image as a buffer:', err)
    return null
  }
}
