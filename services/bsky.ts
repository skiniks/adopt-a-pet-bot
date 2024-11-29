import { AppBskyFeedPost, BskyAgent, RichText } from '@atproto/api'
import { BSKY_PASSWORD, BSKY_USERNAME } from '../config'
import { decodeHtmlEntities } from '../utils/decodeHtmlEntities'
import { getImageAsBuffer } from '../utils/getImageAsBuffer'
import { shortenUrl } from '../utils/shortenUrl'
import { getRandomIntro } from '../utils/getRandomIntro'

interface PetDetails {
  name: string
  description: string
  contact: {
    address: {
      city: string
      state: string
    }
  }
  species: string
  age: string
  url: string
  photoUrls: string[]
  breeds: {
    primary?: string
    secondary?: string
    mixed?: boolean
    unknown?: boolean
  }
}

interface BskyImage {
  $type: 'app.bsky.embed.images#image'
  image: {
    $type: 'blob'
    ref: {
      $link: string
    }
    mimeType: string
    size: number
  }
  alt: string
}

export async function createPost(petDetails: PetDetails): Promise<boolean> {
  try {
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    await agent.login({ identifier: BSKY_USERNAME!, password: BSKY_PASSWORD! })

    petDetails.name = decodeHtmlEntities(petDetails.name)
    if (petDetails.description)
      petDetails.description = decodeHtmlEntities(petDetails.description)

    const imageBuffers = await Promise.all(petDetails.photoUrls.slice(0, 4).map(url => getImageAsBuffer(url)))
    const images: BskyImage[] = []

    for (const buffer of imageBuffers) {
      if (buffer) {
        const upload = await agent.uploadBlob(buffer, { encoding: 'image/jpeg' })
        images.push({
          $type: 'app.bsky.embed.images#image',
          image: {
            $type: 'blob',
            ref: {
              $link: upload.data.blob.ref.$link,
            },
            mimeType: upload.data.blob.mimeType,
            size: upload.data.blob.size,
          },
          alt: createAltText(petDetails),
        })
      }
      else {
        console.error('Failed to retrieve an image buffer.')
      }
    }

    const shortUrl = shortenUrl(petDetails.url, '?referrer_id=')
    const formattedName = petDetails.name.trim().replace(/\s+,/, ',')
    const introSentence = getRandomIntro(petDetails.name, petDetails.species)
    const postText = `${introSentence} ${formattedName}, located in ${petDetails.contact.address.city}, ${petDetails.contact.address.state}.\n\nLearn more: ${shortUrl}`

    const rt = new RichText({ text: postText })
    await rt.detectFacets(agent)

    const postRecord: AppBskyFeedPost.Record = {
      $type: 'app.bsky.feed.post',
      text: rt.text,
      facets: rt.facets,
      embed: {
        $type: 'app.bsky.embed.images',
        images,
      },
      createdAt: new Date().toISOString(),
    }

    const validation = AppBskyFeedPost.validateRecord(postRecord)
    if (!validation.success) {
      console.error('Invalid Post Record:', validation.error)
      return false
    }

    await agent.post(postRecord)
    // eslint-disable-next-line no-console
    console.log('Post created successfully:', postRecord)
    return true
  }
  catch (err) {
    console.error('Error creating post:', err)
    return false
  }
}

function createAltText(details: PetDetails): string {
  let breedStr = details.breeds.primary || 'unknown breed'
  if (details.breeds.secondary)
    breedStr += ` and ${details.breeds.secondary}`
  else if (details.breeds.mixed && !breedStr.toLowerCase().includes('mix'))
    breedStr += ' mix'

  let species = details.species.toLowerCase()
  if (breedStr.toLowerCase().includes(species))
    species = ''
  else species = `${species}, `

  const location = `${details.contact.address.city}, ${details.contact.address.state}`
  return `${details.name} is a ${breedStr} ${species}available for adoption in ${location}.`
}
