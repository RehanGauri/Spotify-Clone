console.log("Let's write Javascript")
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

async function getsongs(folder){
    currFolder = folder
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName('a')       // jitne bhi a tag hai usse lenge (qki a href mai songs h)

    songs = []                             // empty array create kiye
    for(let i = 0; i < as.length; i++){         //loop banaye
        const element = as[i]
        if(element.href.endsWith(".mp3")){          // jo bhi .mp3 se end hora h usse lenge
            songs.push(element.href.split(`/${folder}/`)[1])            // songs ka name split krege aur songs mai push kardege
        }
    }
    // console.log("Songs List:", songs); // Debugging log

        // show all the songs in the playlist
        let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]
        songUL.innerHTML = ""
        for(const song of songs){
            songUL.innerHTML = songUL.innerHTML + `<li>
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
    
    // Attach an event listener to all songs
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e=>{
        e.addEventListener('click', element=>{
            console.log(e.querySelector(".info").firstElementChild.innerHTML)
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
        })
    })
    
    return songs
}

const playMusic = (track, pause=false)=>{
    // let audio = new Audio("/songs/" + track)
    currentsong.src = `${currFolder}/` + track
    if(!pause){
        currentsong.play()
        play.src = "img/pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"

    
}

async function displayAlbums(){
    let a = await fetch(`songs/`)        // fetch karega songs folder ka data
    let response = await a.text()                          // response ke andar data ko text mai
    let div = document.createElement("div")         // new element create kiye
    div.innerHTML = response;     

    let anchors = div.getElementsByTagName("a")
    let cardContainer = document.querySelector(".cardContainer")

    let array =  Array.from(anchors)    
    for (let index = 0; index < array.length; index++) {
    const e = array[index];
    
    // if(e.href.includes("/songs/") && !e.href.includes(".htaccess")){
        if(e.href.includes("/songs/")){

            // let folder = e.href.split("/").slice(-2)[0]
            let folder = new URL(e.href).pathname.split("/").filter(Boolean).pop();


            // Get the metadeta of the folder
            console.log("Detected folder:", folder);

            let a = await fetch(`songs/${folder}/info.json`)
            let response = await a.json();

            console.log(response)

                        // Check if cover.jpg or cover.jpeg exists
                        let coverJpg = await fetch(`/songs/${folder}/cover.jpg`, { method: 'HEAD' });
                        let coverJpeg = await fetch(`/songs/${folder}/cover.jpeg`, { method: 'HEAD' });

            let extension = coverJpg.ok ? ".jpg" : coverJpeg.ok ? ".jpeg" : ""; // Detect correct extension
           

            cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewbox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover${extension}"
                            alt="">
                            <h2>${response.title}</h2>
                            <p>${response.description}</p>
                            </div>`;

        }
    }
        // Load the playlist whenever the card is clicked
        Array.from(document.getElementsByClassName("card")).forEach(e=>{
            e.addEventListener("click", async item=>{
                console.log("Fetching songs")
                songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`)
                playMusic(songs[0])
            })
        })
    }
async function main(){   

    // Get the list of all songs
    await getsongs("songs/ncs")
playMusic(songs[0], true)

    // Display all the albums on the page
    displayAlbums()

    // Attach an event listener to play, previous and next
    play.addEventListener('click', ()=>{
        if(currentsong.paused){
            currentsong.play()
            play.src = "img/pause.svg"
        }
        else{
            currentsong.pause()
            play.src = "img/play.svg"
        }
    })

    // Event Listener for timeupdate event
    currentsong.addEventListener('timeupdate', ()=>{
        console.log(currentsong.currentTime, currentsong.duration);
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)}/${secondsToMinutesSeconds(currentsong.duration)}`
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%"
    })
    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click",(e)=>{
        let percent =  (e.offsetX/e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%"
        currentsong.currentTime = ((currentsong.duration) * percent)/100
    })
    
    // Add an event listener to open left using Hamburger
    document.querySelector('.hamburger').addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "0";
        event.stopPropagation();
    })
    // Add an event listener to close left using close
    document.querySelector('.close').addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "-150%";
        event.stopPropagation();
    })
    // Add an event listener to Close left by clicking anywhere
    document.querySelector('.right').addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "-150%"
    })
    
    // Add an event listener to previous
    document.querySelector("#previous").addEventListener('click', ()=>{
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0])
        if((index-1) >= 0){
            playMusic(songs[index-1])
        }
    })
    // Add an event listener to Next
    document.querySelector("#next").addEventListener('click', ()=>{
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0])
        if((index+1) < songs.length){
            playMusic(songs[index+1])
        }
    })
    // Add an event listener to volume
    document.querySelector(".range").getElementsByTagName('input')[0].addEventListener("input", (e)=>{
        console.log("Setting volume to", e.target.value + "%")
        currentsong.volume = parseInt(e.target.value)/100
        if(currentsong.volume > 0){
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
        }
    })

    // Add an event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click",e=>{
        if(e.target.src.includes("volume.svg")){
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
         currentsong.volume = 0
         document.querySelector(".range").getElementsByTagName('input')[0].value = 0
    }
    else{
        e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            currentsong.volume = ".50"
            document.querySelector(".range").getElementsByTagName('input')[0].value = 50
        }
    })
}

main()
