import axios from 'axios'
import pkg from '@atproto/api'
import request from 'superagent'

const { BskyAgent, AppBskyFeedPost, RichText } = pkg

const PETFINDER_API_KEY = process.env.PETFINDER_API_KEY
const PETFINDER_SECRET = process.env.PETFINDER_SECRET
const BSKY_USERNAME = process.env.BSKY_USERNAME
const BSKY_PASSWORD = process.env.BSKY_PASSWORD

const TOKEN_URL = 'https://api.petfinder.com/v2/oauth2/token'
const ANIMALS_URL = 'https://api.petfinder.com/v2/animals'

let token = ''

async function fetchPetfinderToken() {
  try {
    const response = await axios.post(TOKEN_URL, {
      grant_type: 'client_credentials',
      client_id: PETFINDER_API_KEY,
      client_secret: PETFINDER_SECRET,
    })
    token = response.data.access_token
  }
  catch (error) {
    console.error('Error fetching Petfinder token:', error.message)
  }
}

async function getRandomPet() {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        sort: 'random',
        limit: 1,
      },
    }

    const response = await axios.get(ANIMALS_URL, config)
    if (response.data && response.data.animals && response.data.animals.length > 0) {
      const pet = response.data.animals[0]

      if (!pet.contact.address.city || !pet.contact.address.state) {
        // eslint-disable-next-line no-console
        console.log('Pet does not have city and state. Trying another one...')
        await getRandomPet()
        return
      }

      let photoUrls = []
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
    console.error('Error fetching a random pet:', error.message)
  }
}

async function getImageAsBuffer(imageUrl) {
  try {
    const res = await request.get(imageUrl).responseType('blob')
    return res.body
  }
  catch (err) {
    console.error('Error fetching the image as a buffer:', err)
    return null
  }
}

async function createPost(petDetails) {
  try {
    const agent = new BskyAgent({ service: 'https://bsky.social' })
    await agent.login({ identifier: BSKY_USERNAME, password: BSKY_PASSWORD })

    const imageBuffers = await Promise.all(petDetails.photoUrls.slice(0, 4).map(url => getImageAsBuffer(url)))
    const imageBlobRefs = []

    for (const buffer of imageBuffers) {
      if (buffer) {
        const imageBlobResponse = await agent.uploadBlob(buffer, { encoding: 'image/jpeg' })
        imageBlobRefs.push(imageBlobResponse.data.blob)
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
        // eslint-disable-next-line no-console
        console.log('Post successful:', response)
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
}

export default async (_req, res) => {
  try {
    await fetchPetfinderToken()
    await getRandomPet()
    res.status(200).json({ success: true })
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    res.status(500).json({ success: false, message: error.message })
  }
}
