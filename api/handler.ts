import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchPetfinderToken, getToken } from '../utils/fetchPetfinderToken'
import { getRandomPet } from '../services/getRandomPet'

export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
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
