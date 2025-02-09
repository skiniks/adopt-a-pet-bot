import { ANIMALS_URL } from '../config/index.js'
import { createPost } from './bsky.js'

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

export async function getRandomPet(token: string, retryCount = 0): Promise<void> {
  const MAX_RETRIES = 3

  try {
    if (retryCount >= MAX_RETRIES) {
      console.error('Max retries reached, stopping attempts')
      return
    }

    const response = await fetch(`${ANIMALS_URL}?sort=random&limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const data = await response.json()

    if (!data?.animals?.[0]) {
      console.warn('No pets found.')
      return
    }

    const pet: Pet = data.animals[0]

    if (!pet.photos?.length || !pet.contact.address.city || !pet.contact.address.state) {
      console.warn('Pet missing required data, trying another one...')
      await getRandomPet(token, retryCount + 1)
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
      console.warn('Failed to create post, trying another pet...')
      await getRandomPet(token, retryCount + 1)
    }
  }
  catch (error) {
    console.error('Error fetching random pet:', error)
    if (retryCount < MAX_RETRIES)
      await getRandomPet(token, retryCount + 1)
  }
}
