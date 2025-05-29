console.log("Let's write Javascript");

let currentsong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getsongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName('a');  // Collect all <a> tags from folder listing

    songs = [];
    for (let i = 0; i < as.length; i++) {
        const element = as[i];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    // Show songs in the playlist
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `<li>
            <img class="invert" src="img/music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Rehan</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`;
    }

    // Add event listeners to each song for play on click
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener('click', () => {
            let track = e.querySelector(".info").firstElementChild.innerHTML.trim();
            console.log("Playing track:", track);
            playMusic(track);
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    currentsong.src = `${currFolder}/` + track;
    if (!pause) {
        currentsong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    // Fetch folder names from songs/index.json
    let res = await fetch("songs/index.json");
    let folders = await res.json();

    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";  // Clear previous cards if any

    for (let folder of folders) {
        try {
            console.log("Detected folder:", folder);

            // Fetch metadata from info.json
            let infoRes = await fetch(`songs/${folder}/info.json`);
            let info = await infoRes.json();

            // Check for cover image extension
            let coverJpg = await fetch(`songs/${folder}/cover.jpg`, { method: 'HEAD' });
            let coverJpeg = await fetch(`songs/${folder}/cover.jpeg`, { method: 'HEAD' });
            let extension = coverJpg.ok ? ".jpg" : coverJpeg.ok ? ".jpeg" : "";

            // Append card to container
            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewbox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover${extension}" alt="">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>`;
        } catch (error) {
            console.warn(`Error loading folder: ${folder}`, error);
        }
    }

    // Add click listeners to each album card
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            console.log("Fetching songs");
            songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

async function main() {
    // Initialize with a default folder
    await getsongs("songs/ncs");
    playMusic(songs[0], true);

    // Display albums dynamically
    await displayAlbums();

    // Play/pause toggle button
    play.addEventListener('click', () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "img/pause.svg";
        } else {
            currentsong.pause();
            play.src = "img/play.svg";
        }
    });

    // Update song time display and seekbar progress
    currentsong.addEventListener('timeupdate', () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    // Seekbar click to jump to time
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width);
        document.querySelector(".circle").style.left = (percent * 100) + "%";
        currentsong.currentTime = currentsong.duration * percent;
    });

    // Hamburger menu open/close
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

    // Previous song button
    document.querySelector("#previous").addEventListener('click', () => {
        let currentTrack = currentsong.src.split("/").pop();
        let index = songs.indexOf(currentTrack);
        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Next song button
    document.querySelector("#next").addEventListener('click', () => {
        let currentTrack = currentsong.src.split("/").pop();
        let index = songs.indexOf(currentTrack);
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        }
    });

    // Volume control slider
    document.querySelector(".range input").addEventListener("input", (e) => {
        let volume = parseInt(e.target.value) / 100;
        console.log("Setting volume to", volume * 100 + "%");
        currentsong.volume = volume;
        if (volume > 0) {
            document.querySelector(".volume > img").src = document.querySelector(".volume > img").src.replace("mute.svg", "volume.svg");
        }
    });

    // Mute/unmute volume button
    document.querySelector(".volume > img").addEventListener("click", (e) => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentsong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentsong.volume = 0.5;
            document.querySelector(".range input").value = 50;
        }
    });
}

main();
