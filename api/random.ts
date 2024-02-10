import request from 'superagent'
import type { BlobRef } from '@atproto/api'
import { AppBskyFeedPost, BskyAgent, RichText } from '@atproto/api'
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface Pet {
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
  photos: { large: string }[]
  breeds: {
    primary?: string
    secondary?: string
    mixed?: boolean
    unknown?: boolean
  }
}

interface PetFinderTokenResponse {
  access_token: string
}

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

const PETFINDER_API_KEY: string = process.env.PETFINDER_API_KEY || ''
const PETFINDER_SECRET: string = process.env.PETFINDER_SECRET || ''
const BSKY_USERNAME: string = process.env.BSKY_USERNAME || ''
const BSKY_PASSWORD: string = process.env.BSKY_PASSWORD || ''

const TOKEN_URL: string = 'https://api.petfinder.com/v2/oauth2/token'
const ANIMALS_URL: string = 'https://api.petfinder.com/v2/animals'

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

      if (!pet.contact.address.city || !pet.contact.address.state) {
        console.log('Pet does not have city and state. Trying another one...')
        await getRandomPet()
        return
      }

      let photoUrls: string[] = []
      if (pet.photos && pet.photos.length > 0)
        photoUrls = pet.photos.map(photo => photo.large)

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
        console.log('Failed to create a post with current pet. Trying another one...')
        await getRandomPet()
      }
    }
    else {
      console.log('No pets found.')
    }
  }
  catch (error) {
    console.error('Error fetching a random pet:', error)
  }
}

async function getImageAsBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    const res = await request.get(imageUrl).responseType('blob')
    return res.body
  }
  catch (err) {
    console.error('Error fetching the image as a buffer:', err)
    return null
  }
}

async function createPost(petDetails: PetDetails): Promise<boolean> {
  try {
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    await agent.login({ identifier: BSKY_USERNAME, password: BSKY_PASSWORD })

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

    let breedStr = ''
    if (petDetails.breeds.primary) {
      breedStr = petDetails.breeds.primary
      if (petDetails.breeds.secondary)
        breedStr += ` and ${petDetails.breeds.secondary}`
    }
    else if (petDetails.breeds.unknown) {
      breedStr = 'unknown breed'
    }

    if (petDetails.breeds.mixed && !breedStr.toLowerCase().includes('mix') && !breedStr.toLowerCase().includes('mixed breed'))
      breedStr += ' mix'

    const formattedName = petDetails.name.trim().replace(/\s+,/, ',')
    const postText = `Meet ${formattedName}, located in ${petDetails.contact.address.city}, ${petDetails.contact.address.state}.\n\nLearn more: ${petDetails.url}`

    const rt = new RichText({ text: postText })
    await rt.detectFacets(agent)

    const imagesEmbed = imageBlobRefs.map((blobRef) => {
      const altText = `${formattedName} is a ${breedStr} ${petDetails.species.toLowerCase()}, available for adoption in ${petDetails.contact.address.city}, ${petDetails.contact.address.state}.`

      return {
        $type: 'app.bsky.embed.image',
        image: blobRef,
        alt: altText,
      }
    })

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
        console.log('Post successful')
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

export default async function (req: VercelRequest, res: VercelResponse) {
  try {
    await fetchPetfinderToken()
    await getRandomPet()
    res.status(200).json({ success: true })
  }
  catch (error) {
    if (error instanceof Error) {
      console.log(error.message)
      res.status(500).json({ success: false, message: error.message })
    }
    else {
      console.log('An unknown error occurred')
      res.status(500).json({ success: false, message: 'An unknown error occurred' })
    }
  }
}
