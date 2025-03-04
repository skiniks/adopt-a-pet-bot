export interface PetfinderPet {
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
  videos?: { embed: string }[]
  breeds: {
    primary?: string
    secondary?: string
    mixed?: boolean
    unknown?: boolean
  }
}

export type TransformedPet = Omit<PetfinderPet, 'photos' | 'videos'> & {
  photoUrls: string[]
  videoUrl?: string
}
