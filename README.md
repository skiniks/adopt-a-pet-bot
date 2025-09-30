# Adopt a Pet Bluesky Bot

A bot that shares adoptable pets from Petfinder to [@adoptapet.bsky.social](https://adoptapet.bsky.social) on Bluesky. The bot fetches random pets from the Petfinder API every 30 minutes, helping to increase visibility for pets in need of homes.

## Configuration

Required environment variables:

```
BSKY_PASSWORD=your_bsky_password
BSKY_USERNAME=your_bsky_username
PETFINDER_API_KEY=your_petfinder_api_key
PETFINDER_API_SECRET=your_petfinder_secret
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Run in production mode
pnpm start
```

## Deployment

The bot is hosted on Fly.io with a cron job scheduled to run every 30 minutes using node-cron. The server also exposes a `/health` endpoint for health checks.

To deploy:

```bash
# Deploy to Fly.io
fly deploy

# Set environment variables
fly secrets set BSKY_PASSWORD=your_password
fly secrets set BSKY_USERNAME=your_username
fly secrets set PETFINDER_API_KEY=your_api_key
fly secrets set PETFINDER_API_SECRET=your_secret
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.
