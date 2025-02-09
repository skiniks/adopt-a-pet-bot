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
  breeds: {
    primary?: string
    secondary?: string
    mixed?: boolean
    unknown?: boolean
  }
}

export type TransformedPet = Omit<PetfinderPet, 'photos'> & {
  photoUrls: string[]
}
