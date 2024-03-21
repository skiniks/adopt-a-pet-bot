import type { BlobRef } from '@atproto/api'
import { AppBskyFeedPost, BskyAgent, RichText } from '@atproto/api'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ANIMALS_URL, BSKY_PASSWORD, BSKY_USERNAME, PETFINDER_API_KEY, PETFINDER_SECRET, TOKEN_URL } from '../config'
import type { Pet, PetDetails, PetFinderTokenResponse } from '../types'
import { getRandomIntro } from '../utils/intros'
import { shortenUrl } from '../utils/shortenUrl'
import { decodeHtmlEntities } from '../utils/decodeHtmlEntities'

let token: string = ''

async function fetchPetfinderToken(): Promise<void> {
  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: PETFINDER_API_KEY,
        client_secret: PETFINDER_SECRET,
      }),
    })
    const data: PetFinderTokenResponse = await response.json()
    token = data.access_token
  }
  catch (error) {
    console.error('Error fetching Petfinder token:', error)
  }
}

async function getRandomPet(): Promise<void> {
  try {
    const response = await fetch(`${ANIMALS_URL}?sort=random&limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await response.json()
    if (data && data.animals && data.animals.length > 0) {
      const pet: Pet = data.animals[0]

      if (!pet.photos || pet.photos.length === 0) {
        // eslint-disable-next-line no-console
        console.log('Pet does not have photos. Trying another one...')
        await getRandomPet()
        return
      }

      if (!pet.contact.address.city || !pet.contact.address.state) {
        // eslint-disable-next-line no-console
        console.log('Pet does not have city and state. Trying another one...')
        await getRandomPet()
        return
      }

      const photoUrls: string[] = pet.photos.map(photo => photo.large)

      const postSuccess = await createPost({
        name: pet.name,
        description: pet.description,
        contact: pet.contact,
        species: pet.species,
        age: pet.age,
        url: pet.url,
        photoUrls,
        breeds: pet.breeds,
      })

      if (!postSuccess) {
        // eslint-disable-next-line no-console
        console.log('Failed to create a post with current pet. Trying another one...')
        await getRandomPet()
      }
    }
    else {
      // eslint-disable-next-line no-console
      console.log('No pets found.')
    }
  }
  catch (error) {
    console.error('Error fetching a random pet:', error)
  }
}

async function getImageAsBuffer(imageUrl: string): Promise<Buffer | null> {
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

async function createPost(petDetails: PetDetails): Promise<boolean> {
  try {
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    await agent.login({ identifier: BSKY_USERNAME!, password: BSKY_PASSWORD! })

    petDetails.name = decodeHtmlEntities(petDetails.name)
    if (petDetails.description)
      petDetails.description = decodeHtmlEntities(petDetails.description)

    const imageBuffers = await Promise.all(petDetails.photoUrls.slice(0, 4).map(url => getImageAsBuffer(url)))
    const imageBlobRefs: BlobRef[] = []

    for (const buffer of imageBuffers) {
      if (buffer) {
        const imageBlobResponse = await agent.uploadBlob(buffer, { encoding: 'image/jpeg' })
        const imageBlobRef: BlobRef = imageBlobResponse.data.blob
        imageBlobRefs.push(imageBlobRef)
      }
      else {
        console.error('Failed to retrieve an image buffer.')
      }
    }

    const createAltText = (details) => {
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

    const imagesEmbed = imageBlobRefs.map((blobRef) => {
      const altText = createAltText(petDetails)

      return {
        $type: 'app.bsky.embed.image',
        image: blobRef,
        alt: altText,
      }
    })

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
        images: imagesEmbed,
      },
      createdAt: new Date().toISOString(),
    }

    if (AppBskyFeedPost.isRecord(postRecord)) {
      const res = AppBskyFeedPost.validateRecord(postRecord)
      if (res.success) {
        await agent.post(postRecord)
        // eslint-disable-next-line no-console
        console.log('Post created successfully:', postRecord)
        return true
      }
      else {
        console.error('Invalid Post Record:', res.error)
        return false
      }
    }
  }
  catch (err) {
    console.error('Error creating post:', err)
    return false
  }
  return false
}

export default async function (_req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    await fetchPetfinderToken()
    await getRandomPet()
    res.status(200).json({ success: true })
  }
  catch (error) {
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.log(error.message)
      res.status(500).json({ success: false, message: error.message })
    }
    else {
      // eslint-disable-next-line no-console
      console.log('An unknown error occurred')
      res.status(500).json({ success: false, message: 'An unknown error occurred' })
    }
  }
}
