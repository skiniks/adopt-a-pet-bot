import { CredentialManager, XRPC } from '@atcute/client'
import { uploadVideo } from './services/bsky.js'

if (!process.env.BSKY_USERNAME || !process.env.BSKY_PASSWORD) {
  console.error('Missing required environment variables: BSKY_USERNAME and BSKY_PASSWORD')
  process.exit(1)
}

console.log('Using credentials:', { username: process.env.BSKY_USERNAME })

const TEST_VIDEO_URL = 'https://dbw3zep4prcju.cloudfront.net/animal/21105073-b6df-47ae-9aca-a6cb68284cad/video/17d416bd-2ab8-4520-ad74-26029872a9fd.mp4'

async function test() {
  try {
    console.log('Testing video upload process...')
    console.log('Video URL:', TEST_VIDEO_URL)

    const manager = new CredentialManager({
      service: 'https://bsky.social',
    })
    const rpc = new XRPC({ handler: manager })

    await manager.login({
      identifier: process.env.BSKY_USERNAME!,
      password: process.env.BSKY_PASSWORD!,
    })

    if (!manager.session?.did) {
      throw new Error('Not logged in - no session DID available')
    }

    // Test video upload
    const blob = await uploadVideo(rpc, TEST_VIDEO_URL, manager.session.did)
    console.log('Video upload successful:', blob)

    console.log('Video upload test completed successfully!')
  }
  catch (error) {
    console.error('Test failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        cause: error.cause,
      })
    }
    process.exit(1)
  }
}

test()
