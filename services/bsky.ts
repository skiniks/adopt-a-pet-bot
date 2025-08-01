import type { } from '@atcute/atproto'
import type { } from '@atcute/bluesky'
import type { Buffer } from 'node:buffer'
import type { BskyBlob, BskyImage, TransformedPet } from '../types/index.js'
import RichtextBuilder from '@atcute/bluesky-richtext-builder'
import { Client, CredentialManager, ok } from '@atcute/client'
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

async function uploadBlob(rpc: Client, buffer: Buffer): Promise<BskyBlob> {
  const blob = new Blob([buffer], { type: 'image/jpeg' })
  const response = await rpc.post('com.atproto.repo.uploadBlob', {
    input: blob,
  })
  const data = ok(response)
  return data.blob
}

export async function createPost(petDetails: TransformedPet): Promise<boolean> {
  try {
    const manager = new CredentialManager({
      service: SERVICE!,
    })
    const rpc = new Client({ handler: manager })

    await manager.login({
      identifier: BSKY_USERNAME!,
      password: BSKY_PASSWORD!,
    })

    if (!manager.session?.did) {
      throw new Error('Not logged in - no session DID available')
    }

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
      .addLink(shortUrl, shortUrl as `${string}:${string}`)
      .build()

    const record = {
      $type: 'app.bsky.feed.post',
      text,
      facets,
      createdAt: new Date().toISOString(),
      embed: {
        $type: 'app.bsky.embed.images',
        images,
      },
    }

    const response = await rpc.post('com.atproto.repo.createRecord', {
      input: {
        repo: manager.session.did,
        collection: 'app.bsky.feed.post',
        record,
      },
    })
    ok(response)

    return true
  }
  catch (err) {
    console.error('Error creating post:', err)
    return false
  }
}
