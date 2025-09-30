import process from 'node:process'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import cron from 'node-cron'
import { getRandomPet } from './services/getRandomPet.js'
import { fetchPetfinderToken, getToken } from './utils/fetchPetfinderToken.js'

const app = new Hono()
const PORT = Number(process.env.PORT) || 3000

async function runPetPost() {
  try {
    await fetchPetfinderToken()
    const token = getToken()
    await getRandomPet(token)
    console.warn('Successfully posted pet')
  }
  catch (error) {
    console.error('Error posting pet:', error)
  }
}

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.warn(`Server running on port ${info.port}`)
  console.warn(`Health check available at http://localhost:${info.port}/health`)
})

console.warn('Setting up cron job to run every 30 minutes...')
cron.schedule('*/30 * * * *', async () => {
  console.warn(`Running scheduled pet post at ${new Date().toISOString()}`)
  await runPetPost()
})

process.on('SIGTERM', () => {
  console.warn('SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.warn('SIGINT received, shutting down gracefully...')
  process.exit(0)
})

console.warn('Adopt-a-Pet Bot started successfully')
