import { readdir } from "node:fs/promises";
import { existsSync, statSync, readFileSync } from "node:fs";
import { extname } from "node:path";

function getContentType(filePath) {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp3': return 'audio/mpeg';
    case '.wav': return 'audio/wav';
    case '.ogg': return 'audio/ogg';
    case '.m4a': return 'audio/mp4';
    case '.flac': return 'audio/flac';
    case '.aac': return 'audio/aac';
    default: return 'application/octet-stream';
  }
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Handle API endpoint for music files
    if (url.pathname === '/api/music') {
      const files = await readdir("music/", { recursive: true });
      return new Response(JSON.stringify(files));
    }

    // Serve music files with range request support
    if (url.pathname.startsWith('/music/')) {
      const filePath = decodeURIComponent(url.pathname.slice(1));
      
      if (!existsSync(filePath)) {
        return new Response("File not found", { status: 404 });
      }
      
      const stats = statSync(filePath);
      const range = req.headers.get('range');
      
      // Check if it's an audio file that needs range support
      const isAudioFile = /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(filePath);
      
      if (range && isAudioFile) {
        // Handle range request for seeking
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        
        if (start >= stats.size || end >= stats.size || start > end) {
          return new Response("Range not satisfiable", { 
            status: 416,
            headers: {
              'Content-Range': `bytes */${stats.size}`
            }
          });
        }
        
        const chunksize = (end - start) + 1;
        const file = readFileSync(filePath);
        const chunk = file.slice(start, end + 1);
        
        return new Response(chunk, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${stats.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize.toString(),
            'Content-Type': getContentType(filePath),
            'Cache-Control': 'no-cache'
          }
        });
      } else if (isAudioFile) {
        // Regular audio file request - still need Accept-Ranges header
        const file = Bun.file(filePath);
        return new Response(file, {
          headers: {
            'Accept-Ranges': 'bytes',
            'Content-Type': getContentType(filePath),
            'Content-Length': stats.size.toString()
          }
        });
      } else {
        // Non-audio file - serve normally
        const file = Bun.file(filePath);
        return new Response(file);
      }
    }

    // Handle favicon.ico request
    if (url.pathname === '/favicon.ico') {
      // You can either serve a favicon file if you have one:
      if (existsSync('favicon.ico')) {
        return new Response(Bun.file('favicon.ico'));
      }
      // Or return an empty response
      return new Response(null, { status: 204 });
    }

    // Serve index.html
    if (url.pathname === '/') {
      const html = Bun.file("index.html");
      return new Response(html);
    }

    // Serve other static files
    const filePath = url.pathname.slice(1);
    if (existsSync(filePath)) {
      const file = Bun.file(filePath);
      return new Response(file);
    }
    return new Response("Not found", { status: 404 });
  }
});

console.log(`Server running at http://localhost:${server.port}`);