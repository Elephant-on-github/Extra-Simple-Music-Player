# Simple container that runs a music player

Mount a folder containing `.mp3` or `.opus` to `/app/music/` e.g `-v /media/:/app/music/`

Expose ports to `3000` e.g `-p 3000:3000`

## Example compose.yaml
```yaml
services:
  music:
    image: ghcr.io/elephant-on-github/simplemusic:latest
    restart: unless-stopped
    ports:
      - 3000:3000
    volumes:
      - /DATA/Media/Music:/app/music
      - ./.env:/app/.env
networks: {}
```

You will also need to add a `.env` with your Pexels Api Key. 

```env
PEXELS_API_KEY = Your_API_Key_Here
PEXELS_SEARCH = Rolling hills # Your preferred search term for background images
```
