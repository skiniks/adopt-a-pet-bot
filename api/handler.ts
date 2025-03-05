import type { ApiRequest, ApiResponse } from '../types/index.js'
import { getRandomPet } from '../services/getRandomPet.js'
import { fetchPetfinderToken, getToken } from '../utils/fetchPetfinderToken.js'

export default async function handler(_req: ApiRequest, res: ApiResponse): Promise<void> {
  try {
    await fetchPetfinderToken()
    const token = getToken()
    await getRandomPet(token)
    res.status(200).json({ success: true })
  }
  catch (error) {
    console.error('API Handler Error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    })
  }
}
