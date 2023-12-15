var enableBS, enableHR, enableSC, enableLC;
var goalData;
var heartRate;
var barProgress = 0;
var playingAudio = false;
const audioCTX = new AudioContext();
const audioAnalyzer = audioCTX.createAnalyser();

const socket = io("http://localhost:5500", {
    query: {
        data: JSON.stringify({client: "overlay"})
    }
});

socket.on("liveChat", ({authorName, message }) => {
    displayChat(authorName, message);
});

socket.on("heartRate", (heartRate) => {
    setHeartRate(heartRate);
});

function setHeartRate(heartRate) { 
    $("#heartRateNumber").html(heartRate);
}

function setPlayerData(playerData) {
    $("#disUserName").html(playerData.name);
    $("#disRank").html(playerData.rank);
};

function displayChat(authorName, message) {
    liveChatHTML = $("#liveChat").html();
    liveChatHTML += "<div class=\"chatMessage\"><p class=\"chatUserName\">" + authorName + ": </p><p class=\"chatText\">" + message + "</p></div>";
    $("#liveChat").html(liveChatHTML);
}

function getTTSAudio() {
    try {
        fetch('/getTTS')
                .then(response => { 
                    decodedResponse = response.json;
                    if (decodedResponse.ttsAvailable == false)
                        { 
                            throw new Error("No TTS audio");
                    } else { 
                            return response.arrayBuffer(); 
                        } 
                    })
                .then(arrayBuffer => audioCTX.decodeAudioData(arrayBuffer))
                .then(decodedData => {
                    audio = decodedData;
                    playback();
                })
                .catch(err => () => { return });
    } catch {
        return;
    }
}    


function playback() {
    const playSound = audioCTX.createBufferSource();
    var audio;
    playSound.buffer = audio;

    audio.addEventListener('ended', function() {
        playingAudio = false;
        console.log("Audio ended");
    });

    playSound.connect(audioCTX.destination);
    playSound.start(audioCTX.currentTime);
    playingAudio = true;
}

init();

async function init() {
    await sleep(1200);
    fillFollowerBar();
}

function showRankBox() {
    $("#rankBox").addClass("animate__backInRight");
    $("#rankBox").removeClass("animate__backOutRight");
}

function hideRankBox() {
    $("#rankBox").addClass("animate__backOutRight");
    $("#rankBox").removeClass("animate__backInRight");
}

function showSubscriberGoal() {
    $("#subscriberGoal").addClass("animate__backInUp");
    $("#subscriberGoal").removeClass("animate__backOutDown");
}

function hideSubscriberGoal() {
    $("#subscriberGoal").addClass("animate__backOutDown");
    $("#subscriberGoal").removeClass("animate__backInUp");
}

$(document).ready(() => {
    socket.on("initData", (data) => {
        setPlayerData(data.playerData);
        goalData = data.goalData;
        setHeartRate(data.heartRate);
        enableBS = data.config.enableBS;
        enableHR = data.config.enableHR;
        enableSC = data.config.enableSC;
        enableLC = data.config.enableLC;

        if (enableBS) {
            $("#rankBox").css("display", "flex");
        }
        if (enableSC) {
            $("#subscriberGoal").css("display", "flex");
        }
        if (enableLC) {
            $("#liveChatBox").css("display", "flex");
        }
        if (enableHR) {
            $("#heartRate").css("display", "flex");
        }
        if (enableLC && enableHR) {
            $("#heartRate").css("bottom", "1.6em");
        }
    });


    // Animate rankBox
    if (enableBS) {
        const animateRankBox = setInterval(async function() {
            // Boxes moving onto screen
            if ($("#rankBox").hasClass("animate__backOutRight")) {
                showRankBox();
            }
            // Boxes moving off of screen
            else {
                hideRankBox();
                await sleep(90000);
            }
        }, 30000);
    }

    // Animate follower goal box
    if (enableSC) {
        const animateSubscriberGoal = setInterval(async function() {
            // Boxes moving onto screen
            if ($("#subscriberGoal").hasClass("animate__backOutDown")) {
                showSubscriberGoal();
                await sleep(400)
                fillFollowerBar();
            }
            // Boxes moving off of screen
            else {
                hideSubscriberGoal();
                await sleep(90000);
            }
        }, 30000);
    }
});

// Animation for filling the follower bar
async function fillFollowerBar() {
    $("#subscriberGoal").addClass("animate__pulse");
    await sleep(1200);
    for (let i = 0; i <= goalData.current_amount; i++) {
        $("#goalText").html(`Subscriber Goal ${i}/${goalData.target_amount}`);
        $("#goalProgress").css("width", ((i / goalData.target_amount) * 100) + "%");
        await sleep(30);
    }
    $("#subscriberGoal").removeClass("animate__pulse");
}

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}