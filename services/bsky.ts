import type { BskyBlob, BskyImage } from '../types/bsky.js'
import type { TransformedPet } from '../types/petfinder.js'
import { Buffer } from 'node:buffer'
import RichtextBuilder from '@atcute/bluesky-richtext-builder'
import { CredentialManager, XRPC } from '@atcute/client'
import { BSKY_PASSWORD, BSKY_USERNAME, SERVICE } from '../config/index.js'
import { getImageAsBuffer } from '../utils/getImageAsBuffer.js'
import { getRandomIntro } from '../utils/getRandomIntro.js'
import { shortenUrl } from '../utils/shortenUrl.js'

function createAltText(details: TransformedPet): string {
  let breedStr = details.breeds.primary || 'unknown breed'
  if (details.breeds.secondary)
    breedStr += ` and ${details.breeds.secondary}`
  else if (details.breeds.mixed && !breedStr.toLowerCase().includes('mix'))
    breedStr += ' mix'

  let species = details.species.toLowerCase()
  if (breedStr.toLowerCase().includes(species))
    species = ''
  else
    species = `${species}, `

  const location = `${details.contact.address.city}, ${details.contact.address.state}`
  return `${details.name} is a ${breedStr} ${species}available for adoption in ${location}.`
}

async function uploadBlob(rpc: XRPC, buffer: Buffer, mimeType: string = 'image/jpeg'): Promise<BskyBlob> {
  if (mimeType.startsWith('video/') && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    mimeType = 'video/mp4'
  }

  const blob = new Blob([buffer], { type: mimeType })
  const { data } = await rpc.call('com.atproto.repo.uploadBlob', {
    data: blob,
  })
  return data.blob
}

async function uploadVideo(rpc: XRPC, videoUrl: string, did: string): Promise<BskyBlob> {
  // Get service auth token for video service
  const pdsDid = 'did:web:porcini.us-east.host.bsky.network'

  const { data: tokenData } = await rpc.get('com.atproto.server.getServiceAuth', {
    params: {
      aud: pdsDid,
      lxm: 'com.atproto.repo.uploadBlob',
      exp: Math.floor(Date.now() / 1000 + 60 * 30), // 30 minutes
    },
  })

  // Fetch video content
  const response = await fetch(videoUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.statusText}`)
  }
  const videoBuffer = Buffer.from(await response.arrayBuffer())

  // Check and modify file signature if needed (M4V -> MP4)
  const signature = videoBuffer.subarray(0, 16)
  const signatureHex = Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join(' ')

  // If we detect M4V signature (ftyp followed by M4V), modify it to mp42
  if (signatureHex.includes('66 74 79 70 4d 34 56 20')) {
    videoBuffer.write('mp42', 8)
  }

  // Upload to video service
  const uploadUrl = new URL('https://video.bsky.app/xrpc/app.bsky.video.uploadVideo')
  uploadUrl.searchParams.append('did', did)
  uploadUrl.searchParams.append('name', 'video.mp4')

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.token}`,
      'Content-Type': 'video/mp4',
      'Content-Length': videoBuffer.length.toString(),
    },
    body: videoBuffer,
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    throw new Error(`Failed to upload to video service: ${uploadResponse.statusText}\n${errorText}`)
  }

  const jobStatus = await uploadResponse.json()

  // Poll for job completion
  const maxAttempts = 60 // Maximum 1 minute of polling
  let attempts = 0

  while (true) {
    const statusResponse = await fetch(`https://video.bsky.app/xrpc/app.bsky.video.getJobStatus?jobId=${jobStatus.jobId}`)
    if (!statusResponse.ok) {
      throw new Error(`Failed to get job status: ${statusResponse.statusText}`)
    }

    const status = await statusResponse.json()

    if (status.jobStatus.state === 'JOB_STATE_COMPLETED' && status.jobStatus.blob) {
      return status.jobStatus.blob
    }
    else if (status.jobStatus.state === 'JOB_STATE_FAILED') {
      throw new Error(`Video processing failed: ${status.jobStatus.error || 'Unknown error'}`)
    }

    if (++attempts >= maxAttempts) {
      throw new Error('Video processing timed out after 60 seconds')
    }

    // Wait a second before polling again
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

export async function createPost(petDetails: TransformedPet): Promise<boolean> {
  try {
    const manager = new CredentialManager({
      service: SERVICE!,
    })
    const rpc = new XRPC({ handler: manager })

    await manager.login({
      identifier: BSKY_USERNAME!,
      password: BSKY_PASSWORD!,
    })

    if (!manager.session?.did) {
      throw new Error('Not logged in - no session DID available')
    }

    const did = manager.session.did

    const imageBuffers = await Promise.all(petDetails.photoUrls.slice(0, 4).map(url => getImageAsBuffer(url)))
    const images: BskyImage[] = []

    for (const buffer of imageBuffers) {
      if (buffer) {
        const uploadedBlob = await uploadBlob(rpc, buffer)
        images.push({
          alt: createAltText(petDetails),
          image: {
            $type: 'blob',
            ref: uploadedBlob.ref,
            mimeType: uploadedBlob.mimeType,
            size: uploadedBlob.size,
          },
        })
      }
      else {
        console.error('Failed to retrieve an image buffer.')
      }
    }

    const shortUrl = shortenUrl(petDetails.url, '?referrer_id=')
    const formattedName = petDetails.name.trim().replace(/\s+,/, ',')
    const introSentence = getRandomIntro(petDetails.name, petDetails.species)

    const { text, facets } = new RichtextBuilder()
      .addText(`${introSentence} ${formattedName}, located in ${petDetails.contact.address.city}, ${petDetails.contact.address.state}.\n\nLearn more: `)
      .addLink(shortUrl, shortUrl)
      .build()

    // Create the appropriate embed based on whether we have a video or images
    let embed: any
    if (petDetails.videoUrl) {
      try {
        const uploadedVideo = await uploadVideo(rpc, petDetails.videoUrl, did)

        embed = {
          $type: 'app.bsky.embed.video',
          video: {
            $type: 'blob',
            ref: uploadedVideo.ref,
            mimeType: uploadedVideo.mimeType,
            size: uploadedVideo.size,
          },
          alt: createAltText(petDetails),
        }
      }
      catch (error) {
        console.error('Error processing video, falling back to images:', error)
        embed = {
          $type: 'app.bsky.embed.images',
          images,
        }
      }
    }
    else {
      embed = {
        $type: 'app.bsky.embed.images',
        images,
      }
    }

    const record = {
      $type: 'app.bsky.feed.post',
      text,
      facets,
      createdAt: new Date().toISOString(),
      embed,
    }

    await rpc.call('com.atproto.repo.createRecord', {
      data: {
        repo: manager.session.did,
        collection: 'app.bsky.feed.post',
        record,
      },
    })

    return true
  }
  catch (err) {
    console.error('Error creating post:', err)
    return false
  }
}

export { uploadVideo}
