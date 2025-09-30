import process from 'node:process'

export const PETFINDER_API_KEY = process.env.PETFINDER_API_KEY
export const PETFINDER_SECRET = process.env.PETFINDER_SECRET
export const BSKY_USERNAME = process.env.BSKY_USERNAME
export const BSKY_PASSWORD = process.env.BSKY_PASSWORD
export const TOKEN_URL = 'https://api.petfinder.com/v2/oauth2/token'
export const ANIMALS_URL = 'https://api.petfinder.com/v2/animals'
export const SERVICE = 'https://bsky.social'
