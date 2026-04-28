FROM dhi.io/bun:1-debian13-dev

WORKDIR /app

# Copy all project files into the container
COPY . .

# Expose the server port
EXPOSE 3000

# Declare a mountable volume for music files
VOLUME ["/app/music"]

# Run the server
CMD ["bun", "run", "server.js"]