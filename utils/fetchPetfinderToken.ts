import { PETFINDER_API_KEY, PETFINDER_SECRET, TOKEN_URL } from '../config'

interface PetFinderTokenResponse {
  access_token: string
}

let token: string = ''

export async function fetchPetfinderToken(): Promise<void> {
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

export function getToken(): string {
  return token
}
