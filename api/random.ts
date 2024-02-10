import request from 'superagent'
import { AppBskyFeedPost, BskyAgent, RichText } from '@atproto/api'

const PETFINDER_API_KEY: string | undefined = process.env.PETFINDER_API_KEY
const PETFINDER_SECRET: string | undefined = process.env.PETFINDER_SECRET
const BSKY_USERNAME: string | undefined = process.env.BSKY_USERNAME
const BSKY_PASSWORD: string | undefined = process.env.BSKY_PASSWORD

const TOKEN_URL: string = 'https://api.petfinder.com/v2/oauth2/token'
const ANIMALS_URL: string = 'https://api.petfinder.com/v2/animals'

let token: string = ''

interface PetfinderTokenResponse {
  access_token: string
}

interface Animal {
  name: string
  description: string
  contact: any
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
    const data: PetfinderTokenResponse = await response.json()
    token = data.access_token
  }
  catch (error: any) {
    console.error('Error fetching Petfinder token:', error.message)
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
      const pet: Animal = data.animals[0]

      if (!pet.contact.address.city || !pet.contact.address.state) {
        console.log('Pet does not have city and state. Trying another one...')
        await getRandomPet()
        return
      }

      let photoUrls: string[] = []
      if (pet.photos && pet.photos.length > 0)
        photoUrls = pet.photos.map(photo => photo.large)

      const postSuccess: boolean = await createPost({
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
  catch (error: any) {
    console.error('Error fetching a random pet:', error.message)
  }
}

async function getImageAsBuffer(imageUrl: string): Promise<Uint8Array | null> {
  try {
    const response = await request.get(imageUrl).responseType('arraybuffer');
    const buffer = response.body;

    return new Uint8Array(buffer);
  } catch (err: any) {
    console.error('Error fetching the image as a buffer:', err);
    return null;
  }
}

interface PetDetails {
  name: string
  description: string
  contact: any
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

async function createPost(petDetails: PetDetails): Promise<boolean> {
  try {
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    await agent.login({ identifier: BSKY_USERNAME!, password: BSKY_PASSWORD! })

    const imageBuffers: (Uint8Array | null)[] = await Promise.all(
      petDetails.photoUrls.slice(0, 4).map(url => getImageAsBuffer(url)),
    )

    const imageBlobRefs: string[] = []

    for (const buffer of imageBuffers) {
      if (buffer) {
        // Log to confirm data type and content
        console.log('Buffer type:', typeof buffer)
        console.log('Buffer content:', buffer.slice(0, 30)) // Log a portion of the buffer for inspection

        // Since the API expects a Uint8Array or string, ensure buffer is correctly typed
        const imageBlobResponse = await agent.uploadBlob(buffer, { encoding: 'image/jpeg' })

        // Assuming `imageBlobResponse.data.blob` gives you a BlobRef, handle it appropriately
        console.log('Upload response:', imageBlobResponse)
      }
      else {
        console.error('Failed to retrieve an image buffer.')
      }
    }

    let breedStr: string = ''
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

    const formattedName: string = petDetails.name.trim().replace(/\s+,/, ',')
    const postText: string = `Meet ${formattedName}, located in ${petDetails.contact.address.city}, ${petDetails.contact.address.state}.\n\nLearn more: ${petDetails.url}`

    const rt = new RichText({ text: postText })
    await rt.detectFacets(agent)

    const imagesEmbed = imageBlobRefs.map((blobRef) => {
      const altText: string = `${formattedName} is a ${breedStr} ${petDetails.species.toLowerCase()}, available for adoption in ${petDetails.contact.address.city}, ${petDetails.contact.address.state}.`

      return {
        $type: 'app.bsky.embed.image',
        image: blobRef,
        alt: altText,
      }
    })

    const postRecord = {
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
        const response = await agent.post(postRecord)
        console.log('Post successful:', response)
        return true
      }
      else {
        console.error('Invalid Post Record:', res.error)
        return false
      }
    }
  }
  catch (err: any) {
    console.error('Error creating post:', err)
    return false
  }
  return false
}

export default async (_req: any, res: any): Promise<void> => {
  try {
    await fetchPetfinderToken()
    await getRandomPet()
    res.status(200).json({ success: true })
  }
  catch (error: any) {
    console.log(error)
    res.status(500).json({ success: false, message: error.message })
  }
}
