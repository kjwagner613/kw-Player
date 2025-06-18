document.addEventListener("DOMContentLoaded", () => {
  const audioPlayer = document.getElementById("audioPlayer");
  const statusDisplay = document.getElementById("status");
  const currentSongDisplay = document.getElementById("current-song");
  const playerContainer = document.querySelector(".player-container");

  let currentSongIndex = 0;

  document.querySelectorAll('area[data-action]').forEach(area => {
    area.addEventListener('click', function (event) {
      event.preventDefault();
      const action = this.getAttribute('data-action');
      switch (action) {
        case 'prev':
          playPrevSong();
          break;
        case 'play':
          audioPlayer.play();
          break;
        case 'pause':
          audioPlayer.pause();
          break;
        case 'next':
          playNextSong();
          break;
        case 'songlist':
          window.location.href = 'songlist.html';
          break;
        case 'medallion':
          alert('Medallion feature coming soon!');
          break;
        default:
          console.warn('Unknown action:', action);
      }
    });
  });



  function playSong(index) {
    audioPlayer.src = songs[index].file;
    audioPlayer.play().catch((error) => {
      console.error("Error playing song:", error);
    });
    currentSongIndex = index;
    updateStatus("Playing", songs[index].name);
  }

  function updateStatus(status, songName) {
    statusDisplay.textContent = status;
    const currentSong = songs[currentSongIndex];
    currentSongDisplay.innerHTML = `${currentSong.name}<br>${currentSong.artist}`;
  }

  audioPlayer.addEventListener("ended", () => {
    playNextSong();
  });

  function playNextSong() {
    let nextIndex = currentSongIndex;
    let found = false;
    for (let i = 0; i < songs.length; i++) {
      nextIndex = (nextIndex + 1) % songs.length;
      if (songs[nextIndex].play) {
        found = true;
        break;
      }
    }
    if (found) {
      playSong(nextIndex);
    } else {
      updateStatus("No songs selected to play", "");
      audioPlayer.pause();
    }
  }



  function playPrevSong() {
    let prevIndex = currentSongIndex;
    let found = false;
    for (let i = 0; i < songs.length; i++) {
      prevIndex = (prevIndex - 1 + songs.length) % songs.length;
      if (songs[prevIndex].play) {
        found = true;
        break;
      }
    }
    if (found) {
      playSong(prevIndex);
    } else {
      updateStatus("No songs selected to play", "");
      audioPlayer.pause();
    }
  }


  const selectedSongIndex = localStorage.getItem("selectedSongIndex");
  if (selectedSongIndex !== null) {
    playSong(parseInt(selectedSongIndex));
    localStorage.removeItem("selectedSongIndex");
  } else {
    playSong(0);
  }



});
