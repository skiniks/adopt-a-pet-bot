import { Buffer } from 'node:buffer'
import sharp from 'sharp'

const MAX_IMAGE_SIZE = 1000000 // 1MB limit for Bluesky
const MIN_QUALITY = 70 // Don't go below this quality to maintain acceptable images
const INITIAL_QUALITY = 90 // Start with high quality
const QUALITY_DECREMENT = 10 // How much to reduce quality in each iteration

export async function getImageAsBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.statusText}`)

    const arrayBuffer = await response.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)

    // Only process if the image exceeds Bluesky's limit
    if (buffer.length > MAX_IMAGE_SIZE) {
      const image = sharp(buffer)
      const metadata = await image.metadata()

      // If image is exceptionally large, do an initial resize
      const maxDimension = Math.max(metadata.width || 0, metadata.height || 0)
      if (maxDimension > 2000) {
        buffer = await image
          .resize(2000, 2000, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .toBuffer()
      }

      // Try progressively lower qualities until we get under the size limit
      let quality = INITIAL_QUALITY
      while (buffer.length > MAX_IMAGE_SIZE && quality >= MIN_QUALITY) {
        buffer = await sharp(buffer)
          .jpeg({ quality })
          .toBuffer()

        quality -= QUALITY_DECREMENT
      }

      // If we still can't get under the limit, log a warning but return the best we could do
      if (buffer.length > MAX_IMAGE_SIZE) {
        console.warn(
          `Warning: Image from ${imageUrl} could not be reduced below ${buffer.length} bytes. `
          + 'It may fail to upload to Bluesky.',
        )
      }
    }

    return buffer
  }
  catch (err) {
    console.error('Error processing image:', err)
    return null
  }
}
