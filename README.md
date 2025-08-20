# Simple container that runs a music player
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FElephant-on-github%2FExtra-Simple-Music-Player.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FElephant-on-github%2FExtra-Simple-Music-Player?ref=badge_shield)


Mount folder containing mp3 to /app/music/ e.g -v /media/:/app/music/

Expose ports to 3000 e.g -p 3000:3000

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
networks: {}
```


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FElephant-on-github%2FExtra-Simple-Music-Player.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FElephant-on-github%2FExtra-Simple-Music-Player?ref=badge_large)