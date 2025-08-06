import { readdir } from "node:fs/promises";
import { existsSync, statSync, readFileSync } from "node:fs";
import { extname } from "node:path";
import { createHash } from "node:crypto";

function getContentType(filePath) {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".m4a":
      return "audio/mp4";
    case ".flac":
      return "audio/flac";
    case ".aac":
      return "audio/aac";
    default:
      return "application/octet-stream";
  }
}

// Generate ETag for files to improve caching
function generateETag(stats) {
  return `"${stats.size}-${stats.mtime.getTime()}"`;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle API endpoint for music files
    if (url.pathname === "/api/music") {
      let files = await readdir("music/", { recursive: true });
      // Filter to only include mp3 files
      files = files.filter((file) => file.toLowerCase().endsWith(".mp3"));
      console.log("Serving music files:", files);
      shuffle(files); // Shuffle the files for variety
      return new Response(JSON.stringify(files), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300", // Cache API response for 5 minutes
        },
      });
    }

    // Serve music files with enhanced caching and range request support
    if (url.pathname.startsWith("/music/")) {
      const filePath = decodeURIComponent(url.pathname.slice(1));

      if (!existsSync(filePath)) {
        return new Response("File not found", { status: 404 });
      }

      const stats = statSync(filePath);
      const etag = generateETag(stats);
      const range = req.headers.get("range");
      const ifNoneMatch = req.headers.get("if-none-match");
      const isAudioFile = /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(filePath);

      // Check if client has cached version
      if (ifNoneMatch === etag) {
        return new Response(null, {
          status: 304,
          headers: {
            ETag: etag,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }

      if (range && isAudioFile) {
        // Range requests for audio files
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

        if (start >= stats.size || end >= stats.size || start > end) {
          return new Response("Range not satisfiable", {
            status: 416,
            headers: {
              "Content-Range": `bytes */${stats.size}`,
            },
          });
        }

        const chunksize = end - start + 1;
        const file = readFileSync(filePath);
        const chunk = file.slice(start, end + 1);

        return new Response(chunk, {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${stats.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize.toString(),
            "Content-Type": getContentType(filePath),
            ETag: etag,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      } else if (isAudioFile) {
        // Regular audio file request with strong caching
        const file = Bun.file(filePath);
        return new Response(file, {
          headers: {
            "Accept-Ranges": "bytes",
            "Content-Type": getContentType(filePath),
            "Content-Length": stats.size.toString(),
            ETag: etag,
            "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
            Expires: new Date(Date.now() + 31536000000).toUTCString(), // 1 year from now
          },
        });
      } else {
        // Non-audio files
        const file = Bun.file(filePath);
        return new Response(file, {
          headers: {
            ETag: etag,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    // Handle favicon.ico request
    if (url.pathname === "/favicon.ico") {
      if (existsSync("favicon.ico")) {
        const stats = statSync("favicon.ico");
        const etag = generateETag(stats);
        const ifNoneMatch = req.headers.get("if-none-match");

        if (ifNoneMatch === etag) {
          return new Response(null, { status: 304 });
        }

        return new Response(Bun.file("favicon.ico"), {
          headers: {
            "Cache-Control": "public, max-age=86400",
            ETag: etag,
          },
        });
      }
      return new Response(null, { status: 204 });
    }

    // Serve index.html with caching enabled
    if (url.pathname === "/") {
      const html = Bun.file("index.html");
      return new Response(html, {
        headers: {
          "Cache-Control": "public, max-age=3600", // cache for 1 hour
        },
      });
    }

    // Serve other static files with caching enabled
    const filePath = url.pathname.slice(1);
    if (existsSync(filePath)) {
      const stats = statSync(filePath);
      const etag = generateETag(stats);
      const ifNoneMatch = req.headers.get("if-none-match");

      if (ifNoneMatch === etag) {
        return new Response(null, { status: 304 });
      }

      const file = Bun.file(filePath);
      return new Response(file, {
        headers: {
          "Cache-Control": "public, max-age=3600",
          ETag: etag,
        },
      });
    }
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
let files = await readdir("music/", { recursive: true });
// Filter to only include mp3 files
files = files.filter((file) => file.toLowerCase().endsWith(".mp3"));
console.log("Serving music files:", files);
