document.addEventListener("DOMContentLoaded", () => {
  const audioPlayer = document.getElementById("audioPlayer");
  const statusDisplay = document.getElementById("status");
  const currentSongDisplay = document.getElementById("current-song");
  const playlistSelector = document.getElementById("playlist-selector");
  const playlistDisplay = document.getElementById("playlist");
  const trackList = document.getElementById("track-list");
  const trackCount = document.getElementById("track-count");
  const transportButtons = document.querySelectorAll("[data-action]");
  const songListLink = document.getElementById("songList");

  statusDisplay.textContent = "Paused";

  let currentSongIndex = 0;
  let currentPlaylist = songsKw;
  let currentPlaylistType = "local";
  let soundcloudWidget = null;

  const soundcloudPlaylists = {
    joanneCloud: "https://soundcloud.com/kjwagner613/sets/soundcloud-1",
    kevinCloud: "https://soundcloud.com/kjwagner613/sets/soundcloud-2"
  };

  const playlists = {
    songsKw: songsKw,
    songs: songs,
    joanneCloud: [],
    kevinCloud: []
  };

  const playlistNames = {
    songsKw: "Kevin's Local",
    songs: "Joanne's Local",
    joanneCloud: "Joanne's SoundCloud",
    kevinCloud: "Kevin's SoundCloud"
  };

  playlistDisplay.textContent = playlistNames.songsKw;
  localStorage.setItem("currentPlaylistKey", "songsKw");
  renderTrackList();

  playlistSelector.addEventListener("change", function () {
    const selectedPlaylist = this.value;
    playlistDisplay.textContent = playlistNames[selectedPlaylist];
    localStorage.setItem("currentPlaylistKey", selectedPlaylist);

    if (selectedPlaylist === "joanneCloud" || selectedPlaylist === "kevinCloud") {
      switchToSoundCloud(selectedPlaylist);
    } else {
      switchToLocal(selectedPlaylist);
    }

    renderTrackList();
  });

  if (songListLink) {
    songListLink.addEventListener("click", () => {
      localStorage.setItem("currentPlaylistKey", playlistSelector.value);
    });
  }

  function renderTrackList() {
    if (!trackList || !trackCount) {
      return;
    }

    if (currentPlaylistType === "soundcloud") {
      trackCount.textContent = "Streaming";
      trackList.innerHTML = `
        <div class="track-item">
          <div class="track-number">SC</div>
          <div class="track-meta">
            <strong>${playlistNames[playlistSelector.value]}</strong>
            <span>Use the player controls to browse the SoundCloud set.</span>
          </div>
        </div>
      `;
      return;
    }

    if (!currentPlaylist.length) {
      trackCount.textContent = "0 songs";
      trackList.innerHTML = "";
      return;
    }

    trackCount.textContent = `${currentPlaylist.length} song${currentPlaylist.length === 1 ? "" : "s"}`;
    trackList.innerHTML = "";

    currentPlaylist.forEach((song, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `track-item${index === currentSongIndex ? " is-active" : ""}`;
      item.innerHTML = `
        <span class="track-number">${index + 1}</span>
        <span class="track-meta">
          <strong>${song.name}</strong>
          <span>${song.artist || "Unknown artist"}${song.play ? "" : " • skipped in auto-play"}</span>
        </span>
      `;
      item.addEventListener("click", () => {
        playSong(index);
      });
      trackList.appendChild(item);
    });
  }

  function switchToLocal(playlistKey) {
    currentPlaylistType = "local";
    currentPlaylist = playlists[playlistKey];
    currentSongIndex = 0;

    if (soundcloudWidget) {
      soundcloudWidget.pause();
    }

    document.getElementById("soundcloud-container").style.display = "none";
    audioPlayer.style.display = "block";

    let firstPlayableIndex = 0;
    for (let index = 0; index < currentPlaylist.length; index += 1) {
      if (currentPlaylist[index].play) {
        firstPlayableIndex = index;
        break;
      }
    }

    playSong(firstPlayableIndex, false);
    renderTrackList();
  }

  function switchToSoundCloud(playlistKey) {
    currentPlaylistType = "soundcloud";
    currentSongIndex = 0;

    audioPlayer.pause();
    audioPlayer.currentTime = 0;

    const soundcloudContainer = document.getElementById("soundcloud-container");
    audioPlayer.style.display = "none";
    soundcloudContainer.style.display = "block";

    const playlistUrl = soundcloudPlaylists[playlistKey];
    const widgetUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(playlistUrl)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;

    const iframe = document.getElementById("soundcloud-widget");
    iframe.src = widgetUrl;

    if (typeof SC === "undefined") {
      statusDisplay.textContent = "SoundCloud API Error";
      currentSongDisplay.innerHTML = "SoundCloud API not loaded";
      return;
    }

    soundcloudWidget = SC.Widget(iframe);
    soundcloudWidget.bind(SC.Widget.Events.READY, () => {
      updateStatusForSoundCloud();
      renderTrackList();
    });

    soundcloudWidget.bind(SC.Widget.Events.PLAY, () => {
      updateStatusForSoundCloud("Playing");
    });

    soundcloudWidget.bind(SC.Widget.Events.PAUSE, () => {
      updateStatusForSoundCloud("Paused");
    });
  }

  function updateStatusForSoundCloud(status = "Ready") {
    if (!soundcloudWidget) {
      return;
    }

    soundcloudWidget.getCurrentSound((currentSound) => {
      statusDisplay.textContent = status;
      if (currentSound) {
        currentSongDisplay.innerHTML = `${currentSound.title}<br>${currentSound.user.username}`;
      } else {
        currentSongDisplay.innerHTML = "SoundCloud Playlist";
      }
    });
  }

  transportButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-action");

      if (currentPlaylistType === "soundcloud" && soundcloudWidget) {
        switch (action) {
          case "prev":
            soundcloudWidget.prev();
            break;
          case "play":
            soundcloudWidget.play();
            break;
          case "pause":
            soundcloudWidget.pause();
            break;
          case "next":
            soundcloudWidget.next();
            break;
          default:
            break;
        }
        return;
      }

      switch (action) {
        case "prev":
          playPrevSong();
          break;
        case "play":
          audioPlayer.play();
          break;
        case "pause":
          audioPlayer.pause();
          break;
        case "next":
          playNextSong();
          break;
        default:
          break;
      }
    });
  });

  function playSong(index, autoPlay = true) {
    if (!currentPlaylist[index]) {
      return;
    }

    currentSongIndex = index;
    audioPlayer.src = currentPlaylist[index].file;

    if (autoPlay) {
      audioPlayer.play().catch((error) => {
        console.error("Error playing song:", error);
      });
      updateStatus("Playing");
    } else {
      audioPlayer.load();
      updateStatus("Paused");
    }

    renderTrackList();
  }

  function updateStatus(status) {
    statusDisplay.textContent = status;
    const currentSong = currentPlaylist[currentSongIndex];
    if (!currentSong) {
      currentSongDisplay.innerHTML = "No song playing";
      return;
    }

    currentSongDisplay.innerHTML = `${currentSong.name}<br>${currentSong.artist || "Unknown artist"}`;
  }

  audioPlayer.addEventListener("ended", () => {
    playNextSong();
  });

  audioPlayer.addEventListener("play", () => {
    updateStatus("Playing");
  });

  audioPlayer.addEventListener("pause", () => {
    if (currentPlaylistType === "local") {
      updateStatus("Paused");
    }
  });

  function playNextSong() {
    let nextIndex = currentSongIndex;
    let found = false;

    for (let index = 0; index < currentPlaylist.length; index += 1) {
      nextIndex = (nextIndex + 1) % currentPlaylist.length;
      if (currentPlaylist[nextIndex].play) {
        found = true;
        break;
      }
    }

    if (found) {
      playSong(nextIndex);
    } else {
      statusDisplay.textContent = "No songs selected to play";
      audioPlayer.pause();
    }
  }

  function playPrevSong() {
    let prevIndex = currentSongIndex;
    let found = false;

    for (let index = 0; index < currentPlaylist.length; index += 1) {
      prevIndex = (prevIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
      if (currentPlaylist[prevIndex].play) {
        found = true;
        break;
      }
    }

    if (found) {
      playSong(prevIndex);
    } else {
      statusDisplay.textContent = "No songs selected to play";
      audioPlayer.pause();
    }
  }

  const selectedSongIndex = localStorage.getItem("selectedSongIndex");
  const selectedPlaylistKey = localStorage.getItem("selectedPlaylistKey");

  if (selectedSongIndex !== null) {
    if (selectedPlaylistKey && playlists[selectedPlaylistKey]) {
      playlistSelector.value = selectedPlaylistKey;
      playlistDisplay.textContent = playlistNames[selectedPlaylistKey];
      localStorage.setItem("currentPlaylistKey", selectedPlaylistKey);

      if (selectedPlaylistKey === "joanneCloud" || selectedPlaylistKey === "kevinCloud") {
        switchToSoundCloud(selectedPlaylistKey);
      } else {
        currentPlaylist = playlists[selectedPlaylistKey];
        currentPlaylistType = "local";
      }
    }

    if (currentPlaylistType === "local") {
      playSong(parseInt(selectedSongIndex, 10));
    }

    localStorage.removeItem("selectedSongIndex");
    localStorage.removeItem("selectedPlaylistKey");
  } else {
    playSong(0, false);
  }
});
