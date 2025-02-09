# Adopt a Pet Bluesky Bot

A serverless bot that shares adoptable pets from Petfinder to [@adoptapet.bsky.social](https://bsky.app/profile/adoptapet.bsky.social) on Bluesky. The bot fetches random pets from the Petfinder API every 30 minutes on Bluesky, helping to increase visibility for pets in need of homes.

## Configuration

Required environment variables:

```
BSKY_PASSWORD=your_bsky_password
BSKY_USERNAME=your_bsky_username
PETFINDER_API_KEY=your_petfinder_api_key
PETFINDER_API_SECRET=your_petfinder_secret
```

## Deployment

The bot is hosted on Vercel with a cron job scheduled to run every 30 minutes, as defined in `vercel.json`.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
