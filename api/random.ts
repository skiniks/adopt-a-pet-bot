import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchPetfinderToken } from '../utils/fetchPetfinderToken'
import { getRandomPet } from '../utils/getRandomPet'

export default async function (_req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    await fetchPetfinderToken()
    await getRandomPet()
    res.status(200).json({ success: true })
  }
  catch (error) {
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.log(error.message)
      res.status(500).json({ success: false, message: error.message })
    }
    else {
      // eslint-disable-next-line no-console
      console.log('An unknown error occurred')
      res.status(500).json({ success: false, message: 'An unknown error occurred' })
    }
  }
}
