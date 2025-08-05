FROM alpine:latest
RUN command -v bun || (apk add --no-cache curl && curl -fsSL https://bun.sh/install | bash)
WORKDIR /app
COPY . .
RUN bun install
EXPOSE 3000
CMD ["bun", "run", "server.js"]
# This Dockerfile sets up a simple music website using Bun on Alpine Linux.
# It installs Bun, copies the application files, installs dependencies, exposes port 3000,
# and runs the server.
# To build the Docker image, run:
# docker build -t simple-music-website .