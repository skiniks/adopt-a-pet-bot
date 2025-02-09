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

export async function getRandomPet(token: string): Promise<void> {
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
        console.warn('Pet does not have photos. Trying another one...')
        await getRandomPet(token)
        return
      }

      if (!pet.contact.address.city || !pet.contact.address.state) {
        console.warn('Pet does not have city and state. Trying another one...')
        await getRandomPet(token)
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
        console.warn('Failed to create a post with current pet. Trying another one...')
        await getRandomPet(token)
      }
    }
    else {
      console.warn('No pets found.')
    }
  }
  catch (error) {
    console.error('Error fetching a random pet:', error)
  }
}
