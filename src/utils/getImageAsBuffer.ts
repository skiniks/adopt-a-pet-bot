import { Buffer } from 'node:buffer'
import sharp from 'sharp'

const MAX_IMAGE_SIZE = 950000 // ~950KB - leave buffer below Bluesky's 976KB limit
const MIN_QUALITY = 60 // Don't go below this quality to maintain acceptable images
const INITIAL_QUALITY = 85 // Start with good quality
const QUALITY_DECREMENT = 5 // How much to reduce quality in each iteration

export async function getImageAsBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.statusText}`)

    const arrayBuffer = await response.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)

    const image = sharp(buffer)

    // If image is too large, progressively resize and compress
    if (buffer.length > MAX_IMAGE_SIZE) {
      // Try different resize dimensions if needed
      const resizeSizes = [2000, 1600, 1400, 1200]

      for (const size of resizeSizes) {
        const resizedBuffer = await image
          .resize(size, size, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .withMetadata()
          .toBuffer()

        buffer = Buffer.from(resizedBuffer)

        // Try progressively lower qualities
        let quality = INITIAL_QUALITY
        while (buffer.length > MAX_IMAGE_SIZE && quality >= MIN_QUALITY) {
          const compressedBuffer = await sharp(buffer)
            .jpeg({ quality, mozjpeg: true })
            .withMetadata()
            .toBuffer()
          buffer = Buffer.from(compressedBuffer)
          quality -= QUALITY_DECREMENT
        }

        // If we got under the limit, we're done
        if (buffer.length <= MAX_IMAGE_SIZE) {
          break
        }
      }

      // If still too large, reject it
      if (buffer.length > MAX_IMAGE_SIZE) {
        console.error(
          `Image from ${imageUrl} is ${buffer.length} bytes after compression. `
          + `Maximum is ${MAX_IMAGE_SIZE} bytes. Skipping this image.`,
        )
        return null
      }
    }

    return buffer
  }
  catch (err) {
    console.error('Error processing image:', err)
    return null
  }
}
