let currentTrackIndex = 0;
let musicFiles = [];

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
      // Create hidden audio element
      const audio = document.createElement("audio");
      audio.id = "audio-element";
      document.body.appendChild(audio);

      // Load first track
      loadTrack(0);
      initializePlayer();
    } else {
      document.getElementById("track-title").textContent =
        "No music files available";
    }
  } catch (error) {
    console.error("Error loading music:", error);
    document.getElementById("track-title").textContent = "Error loading music";
  }
}

function loadTrack(index) {
  const audio = document.getElementById("audio-element");
  const trackTitle = document.getElementById("track-title");

  if (musicFiles[index]) {
    audio.src = `music/${musicFiles[index]}`;
    trackTitle.textContent = musicFiles[index].replace(/\.[^/.]+$/, ""); // Remove extension
    currentTrackIndex = index;
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
  prevBtn.addEventListener("click", () => {
    currentTrackIndex =
      (currentTrackIndex - 1 + musicFiles.length) % musicFiles.length;
    loadTrack(currentTrackIndex);
    audio.play();
    playBtn.textContent = "⏸";
  });

  nextBtn.addEventListener("click", () => {
    currentTrackIndex = (currentTrackIndex + 1) % musicFiles.length;
    loadTrack(currentTrackIndex);
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
  audio.addEventListener("ended", () => {
    currentTrackIndex = (currentTrackIndex + 1) % musicFiles.length;
    loadTrack(currentTrackIndex);
    audio.play();
  });

  // Your existing seeking event handler
  audio.onseeking = (event) => {
    console.log("Audio is seeking a new position.");
  };
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Replace your existing loadMusic function with this one
window.addEventListener("load", loadMusic);
