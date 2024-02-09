const process = require('node:process')

const config = {
  PETFINDER_API_KEY: process.env.PETFINDER_API_KEY,
  PETFINDER_SECRET: process.env.PETFINDER_SECRET,
  BSKY_USERNAME: process.env.BSKY_USERNAME,
  BSKY_PASSWORD: process.env.BSKY_PASSWORD,
}

export default config
