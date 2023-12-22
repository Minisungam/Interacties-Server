var enableBS, enableHR, enableSC, enableLC;
var goalData;
var heartRate;
var playingAudio = false;
var offScreenTime = 90000;

/* Socket setup */
const socket = io("http://localhost:5500", {
    query: {
        data: JSON.stringify({client: "overlay"})
    }
});
/********* Socket events *********/

// Socket event for initializing the data on connect
socket.on("initData", (data) => {
    setPlayerData(data.playerData);
    goalData = data.goalData;
    setHeartRate(data.heartRate);
    enableBS = data.config.enableBS;
    enableHR = data.config.enableHR;
    enableSC = data.config.enableSC;
    enableLC = data.config.enableLC;

    if (enableBS) {
        console.log("Beat Saber enabled.");
        $("#rankBox").css("display", "block");
    }
    if (enableSC) {
        console.log("Subscriber count enabled.");
        $("#subscriberGoal").css("display", "flex");
    }
    if (enableLC) {
        console.log("Live chat enabled.");
        $("#liveChatBox").css("display", "flex");
    }
    if (enableHR) {
        console.log("Heart rate enabled.");
        $("#heartRate").css("display", "block");
    }
    if (enableLC && enableHR) {
        $("#heartRate").css("bottom", "1.6em");
    }
});

// Socket event for recieving live chat messages
socket.on("liveChat", ({authorName, message }) => {
    displayChat(authorName, message);
});

// Socket event for recieving the heart rate
socket.on("heartRate", (heartRate) => {
    setHeartRate(heartRate);
});

// Socket event for recieving tts messages
socket.on("ttsReady", ({chat, mp3})  => {
    try {
        const audio = new Audio();
        const mp3Blob = new Blob([mp3], {type: "audio/mp3"});
        audio.src = URL.createObjectURL(mp3Blob);

        audio.onended = () => {
            socket.emit("ttsEnded");
        }

        audio.play();
    } catch (error) {
        console.log(error);
    }
    
    console.log("TTS playing: " + chat);
});
/********* End socket events *********/


/********* Settings page socket events *********/
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
/********* End settings page socket events *********/


/********* Animation functions *********/

// Animation for showing the rank box
async function showRankBox() {
    $("#rankBox").addClass("animate__backInRight");
    $("#rankBox").removeClass("animate__backOutRight");
    await sleep(offScreenTime / 3);
    hideRankBox();
}

// Animation for hiding the rank box
function hideRankBox() {
    $("#rankBox").addClass("animate__backOutRight");
    $("#rankBox").removeClass("animate__backInRight");
}

// Animation for showing the subscriber goal
async function showSubscriberGoal() {
    $("#subscriberGoal").addClass("animate__backInUp");
    $("#subscriberGoal").removeClass("animate__backOutDown");
    await sleep(offScreenTime / 3);
    hideSubscriberGoal();
}

// Animation for hiding the subscriber goal
function hideSubscriberGoal() {
    $("#subscriberGoal").addClass("animate__backOutDown");
    $("#subscriberGoal").removeClass("animate__backInUp");
}

// Controller for the subscriber goal animation
async function subscriberGoal() {
    await showSubscriberGoal();
    await sleep(offScreenTime);
    subscriberGoal();
}

// Controller for the rank box animation
async function rankBox() {
    await showRankBox();
    await sleep(offScreenTime);
    rankBox();
}

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
/********* End animation functions *********/


// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initial setup function
$(document).ready( async function() {
    await sleep(5000);
    fillFollowerBar();
    subscriberGoal();
    rankBox();
});