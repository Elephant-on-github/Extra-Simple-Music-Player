let currentTrackIndex = 0;
let musicFiles = [];
let audioCache = new Map(); // Cache for audio elements
let preloadedTracks = new Set(); // Track which files are preloaded

async function loadMusic() {
  const musicDiv = document.querySelector(".music .custom-player");

  try {
    // Fetch music files list from your API endpoint
    const response = await fetch("/api/music", {
      cache: "force-cache",
      headers: {
        "Content-Type": "application/music",
      },
    });
    musicFiles = await response.json();

    if (musicFiles.length > 0) {
      // Create main audio element
      const audio = document.createElement("audio");
      audio.id = "audio-element";
      audio.preload = "metadata"; // Preload metadata for better UX
      document.body.appendChild(audio);

      // Load first track
      await loadTrack(0);
      initializePlayer();

      // Start preloading adjacent tracks
      preloadAdjacentTracks(0);
    } else {
      document.getElementById("track-title").textContent =
        "No music files available";
    }
  } catch (error) {
    console.error("Error loading music:", error);
    document.getElementById("track-title").textContent = "Error loading music";
  }
}

// Preload tracks adjacent to current track
function preloadAdjacentTracks(currentIndex) {
  const tracksToPreload = [
    (currentIndex - 1 + musicFiles.length) % musicFiles.length, // Previous
    (currentIndex + 1) % musicFiles.length, // Next
  ];

  tracksToPreload.forEach(index => {
    const filename = musicFiles[index];
    if (filename && !preloadedTracks.has(filename)) {
      preloadTrack(filename);
    }
  });
}

// Preload a single track
function preloadTrack(filename) {
  if (preloadedTracks.has(filename)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = `music/${filename}`;
    
    const onLoad = () => {
      audioCache.set(filename, audio);
      preloadedTracks.add(filename);
      console.log(`Preloaded: ${filename}`);
      cleanup();
      resolve();
    };

    const onError = () => {
      console.warn(`Failed to preload: ${filename}`);
      cleanup();
      resolve(); // Don't reject, just continue
    };

    const cleanup = () => {
      audio.removeEventListener('canplaythrough', onLoad);
      audio.removeEventListener('error', onError);
    };

    audio.addEventListener('canplaythrough', onLoad, { once: true });
    audio.addEventListener('error', onError, { once: true });
  });
}

async function loadTrack(index) {
  const audio = document.getElementById("audio-element");
  const trackTitle = document.getElementById("track-title");

  if (musicFiles[index]) {
    const filename = musicFiles[index];
    const trackUrl = `music/${filename}`;
    
    // Check if we have a cached version
    if (audioCache.has(filename)) {
      const cachedAudio = audioCache.get(filename);
      audio.src = cachedAudio.src;
      console.log(`Using cached audio for: ${filename}`);
    } else {
      // Load normally but with caching headers
      audio.src = trackUrl;
      // Add to preloaded tracks once it loads
      audio.addEventListener('canplaythrough', () => {
        preloadedTracks.add(filename);
      }, { once: true });
    }

    trackTitle.textContent = filename.replace(/\.[^/.]+$/, ""); // Remove extension
    currentTrackIndex = index;

    // Preload adjacent tracks
    preloadAdjacentTracks(index);
  }
}

function initializePlayer() {
  const audio = document.getElementById("audio-element");
  const playBtn = document.getElementById("play-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const progressBar = document.getElementById("progress-bar");
  const progress = document.getElementById("progress");
  const currentTimeEl = document.getElementById("current-time");
  const durationEl = document.getElementById("duration");
  const volumeSlider = document.getElementById("volume-slider");

  // Play/Pause functionality
  playBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      playBtn.textContent = "⏸";
    } else {
      audio.pause();
      playBtn.textContent = "▶";
    }
  });

  // Previous/Next track
  prevBtn.addEventListener("click", async () => {
    currentTrackIndex =
      (currentTrackIndex - 1 + musicFiles.length) % musicFiles.length;
    await loadTrack(currentTrackIndex);
    audio.play();
    playBtn.textContent = "⏸";
  });

  nextBtn.addEventListener("click", async () => {
    currentTrackIndex = (currentTrackIndex + 1) % musicFiles.length;
    await loadTrack(currentTrackIndex);
    audio.play();
    playBtn.textContent = "⏸";
  });

  // Progress bar
  audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
      const progressPercent = (audio.currentTime / audio.duration) * 100;
      progress.style.width = progressPercent + "%";

      currentTimeEl.textContent = formatTime(audio.currentTime);
      durationEl.textContent = formatTime(audio.duration);
    }
  });

  // Click to seek
  progressBar.addEventListener("click", (e) => {
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressBarWidth = rect.width;
    const clickRatio = clickX / progressBarWidth;

    if (audio.duration) {
      audio.currentTime = clickRatio * audio.duration;
    }
  });

  // Volume control
  volumeSlider.addEventListener("input", (e) => {
    audio.volume = e.target.value / 100;
  });

  // Set initial volume
  audio.volume = 0.5;

  // Auto-play next track when current ends
  audio.addEventListener("ended", async () => {
    currentTrackIndex = (currentTrackIndex + 1) % musicFiles.length;
    await loadTrack(currentTrackIndex);
    audio.play();
  });

  // Your existing seeking event handler
  audio.onseeking = (event) => {
    console.log("Audio is seeking a new position.");
  };

  // Clean up old cached audio elements periodically
  setInterval(() => {
    if (audioCache.size > 10) { // Keep only 10 cached tracks
      const keys = Array.from(audioCache.keys());
      const oldestKey = keys[0];
      audioCache.delete(oldestKey);
      preloadedTracks.delete(oldestKey);
      console.log(`Cleaned up cached audio: ${oldestKey}`);
    }
  }, 30000); // Check every 30 seconds
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Replace your existing loadMusic function with this one
window.addEventListener("load", loadMusic);