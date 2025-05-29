// Initialize the audio object for playing songs
let currentSong = new Audio();

// Arrays to hold the list of songs and the current playlist folder
let songs = [];
let currentFolder = "";

// Utility function to convert seconds to MM:SS format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Function to load songs from a specified playlist folder
async function getSongs(folder) {
    currentFolder = folder; // Set the current folder

    try {
        // Fetch the index.json file containing playlist information
        const response = await fetch('/songs/index.json');
        const playlists = await response.json();

        // Find the playlist matching the specified folder
        const playlist = playlists.find(p => p.playlist === folder);
        if (!playlist) {
            console.warn(`Playlist "${folder}" not found in index.json`);
            return [];
        }

        songs = playlist.songs; // Set the songs array to the playlist's songs

        // Get the song list container in the DOM
        const songList = document.querySelector(".songlist ul");
        songList.innerHTML = ""; // Clear any existing songs

        // Loop through each song and add it to the DOM
        songs.forEach(song => {
            const listItem = document.createElement("li");

            // Create and append the music icon
            const img = document.createElement("img");
            img.classList.add("invert");
            img.src = "img/music.svg";
            img.alt = "song icon";
            listItem.appendChild(img);

            // Create and append the song info
            const infoDiv = document.createElement("div");
            infoDiv.classList.add("info");

            const songNameDiv = document.createElement("div");
            songNameDiv.textContent = song.replaceAll("%20", " ");
            infoDiv.appendChild(songNameDiv);

            const artistDiv = document.createElement("div");
            artistDiv.textContent = "Rehan";
            infoDiv.appendChild(artistDiv);

            listItem.appendChild(infoDiv);

            // Create and append the play now button
            const playNowDiv = document.createElement("div");
            playNowDiv.classList.add("playnow");

            const span = document.createElement("span");
            span.textContent = "Play Now";
            playNowDiv.appendChild(span);

            const playImg = document.createElement("img");
            playImg.classList.add("invert");
            playImg.src = "img/play.svg";
            playImg.alt = "play icon";
            playNowDiv.appendChild(playImg);

            listItem.appendChild(playNowDiv);

            // Add click event to play the selected song
            listItem.addEventListener("click", () => {
                playMusic(song);
            });

            // Append the list item to the song list
            songList.appendChild(listItem);
        });

        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

// Function to play a specified song
function playMusic(track, pause = false) {
    if (!track) {
        console.warn("No track specified to play.");
        return;
    }

    currentSong.src = `/songs/${currentFolder}/${track}`; // Set the audio source

    if (!pause) {
        currentSong.play(); // Play the song
        document.getElementById("play").src = "img/pause.svg"; // Update play button to pause icon
    }

    // Update the song info in the UI
    document.querySelector(".songinfo").textContent = decodeURI(track);
    document.querySelector(".songtime").textContent = "00:00 / 00:00";
}

// Function to display all available playlists as album cards
async function displayAlbums() {
    try {
        const response = await fetch('/songs/index.json');
        const playlists = await response.json();

        const container = document.querySelector(".cardContainer");
        container.innerHTML = ""; // Clear existing cards

        for (const playlist of playlists) {
            const folder = playlist.playlist;

            // Attempt to fetch cover image (jpg or jpeg)
            let coverExt = ".jpg";
            let coverResponse = await fetch(`/songs/${folder}/cover${coverExt}`, { method: 'HEAD' });
            if (!coverResponse.ok) {
                coverExt = ".jpeg";
                coverResponse = await fetch(`/songs/${folder}/cover${coverExt}`, { method: 'HEAD' });
                if (!coverResponse.ok) {
                    coverExt = ""; // No cover image found
                }
            }

            // Create the album card
            const card = document.createElement("div");
            card.classList.add("card");
            card.dataset.folder = folder;

            const playDiv = document.createElement("div");
            playDiv.classList.add("play");
            playDiv.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 20V4L19 12L5 20Z" fill="#000"/>
                </svg>
            `;
            card.appendChild(playDiv);

            const img = document.createElement("img");
            img.src = coverExt ? `/songs/${folder}/cover${coverExt}` : "img/default-cover.jpg";
            img.alt = "cover";
            card.appendChild(img);

            const title = document.createElement("h2");
            title.textContent = playlist.playlist;
            card.appendChild(title);

            const songCount = document.createElement("p");
            songCount.textContent = `${playlist.songs.length} songs`;
            card.appendChild(songCount);

            // Add click event to load and play the playlist
            card.addEventListener("click", async () => {
                songs = await getSongs(folder);
                if (songs.length > 0) {
                    playMusic(songs[0]);
                }
            });

            container.appendChild(card);
        }
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

// Main function to initialize the music player
async function main() {
    // Load the default playlist (e.g., "ncs")
    songs = await getSongs("ncs");
    if (songs.length > 0) {
        playMusic(songs[0], true); // Load the first song without autoplay
    }

    await displayAlbums(); // Display all playlists

    // Play/Pause button functionality
    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.getElementById("play").src = "img/pause.svg";
        } else {
            currentSong.pause();
            document.getElementById("play").src = "img/play.svg";
        }
    });

    // Update the seek bar and song time as the song plays
    currentSong.addEventListener("timeupdate", () => {
        const currentTime = currentSong.currentTime;
        const duration = currentSong.duration;

        document.querySelector(".songtime").textContent =
            `${secondsToMinutesSeconds(currentTime)} / ${secondsToMinutesSeconds(duration)}`;

        document.querySelector(".circle").style.left = `${(currentTime / duration) * 100}%`;
    });

    // Seek functionality when clicking on the progress bar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        const seekBar = e.currentTarget;
        const percent = e.offsetX / seekBar.getBoundingClientRect().width;
        currentSong.currentTime = percent * currentSong.duration;
    });

    // Previous song button functionality
    document.getElementById("previous").addEventListener("click", () => {
        const currentIndex = songs.indexOf(currentSong.src.split("/").pop());
        if (currentIndex > 0) {
            playMusic(songs[currentIndex - 1]);
        }
    });

    // Next song button functionality
    document.getElementById("next").addEventListener("click", () => {
        const currentIndex = songs.indexOf(currentSong.src.split("/").pop());
        if (currentIndex < songs.length - 1) {
            playMusic(songs[currentIndex + 1]);
        }
    });

    // Volume control functionality
    document.querySelector(".range input").addEventListener("input", (e) => {
        const volume = parseInt(e.target.value) / 100;
        currentSong.volume = volume;
        document.querySelector(".volume img").src = volume === 0 ? "img/mute.svg" : "img/volume.svg";
    });

    // Mute/Unmute functionality
    document.querySelector(".volume img").addEventListener("click", (e) => {
        if (currentSong.volume > 0) {
            currentSong.volume = 0;
            e.target.src = "img/mute.svg";
            document.querySelector(".range input").value = 0;
        } else {
            currentSong.volume = 0.5;
            e.target.src = "img/volume.svg";
            document.querySelector(".range input").value = 50;
        }
    });

    // Sidebar toggle functionality
    document.querySelector('.hamburger').addEventListener("click", (event) => {
        document.querySelector(".left").style.left = "0";
        event.stopPropagation();
    });

    document.querySelector('.close').addEventListener("click", (event) => {
        document.querySelector(".left").style.left = "-150%";
        event.stopPropagation();
    });

    document.querySelector('.right').addEventListener("click", () => {
        document.querySelector(".left").style.left = "-150%";
    });
}

// Call the main function to start the music player
main();
