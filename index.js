// Christopher Magnus 2023
// CC BY-NC-ND 4.0

// Imports
const data = require('./data.js');
const Queue = require("./queue.js");
const { initHeartRate, initLiveChat, refreshGoalData, refreshPlayerData } = require("./services.js");
const express = require("express");
const http = require("http");
const fs = require("fs");
const util = require('util');
const textToSpeech = require('@google-cloud/text-to-speech');

const appVersion = '1.0.0';
const asciiArt = `
  _____       _                      _   _           
 |_   _|     | |                    | | (_)          
   | |  _ __ | |_ ___ _ __ __ _  ___| |_ _  ___  ___ 
   | | | '_ \\| __/ _ \\ '__/ _' |/ __| __| |/ _ \\/ __|
  _| |_| | | | ||  __/ | | (_| | (__| |_| |  __/\\__ \\
 |_____|_| |_|\\__\\___|_|  \\__,_|\\___|\\__|_|\\___||___/
                                                     
Version: ${appVersion}
`;

process.env.GOOGLE_APPLICATION_CREDENTIALS = "google_auth.json";

// Server Setup
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
const PORT = process.env.PORT || 5500;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

// Read config file
data.config = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));
data.goalData.target_amount = data.config.subscriberGoal;

// TTS Function
async function getTTS(message) {
    const ttsClient = new textToSpeech.TextToSpeechClient();

    // Construct the request
    const request = {
        input: { text: message },
        // Select the language and SSML voice gender (optional)
        voice: { name: 'en-US-Studio-O', languageCode: 'en-US', ssmlGender: 'FEMALE' },
        // Select the type of audio encoding
        audioConfig: { audioEncoding: 'MP3' },
    };

    try {
        // Performs the text-to-speech request
        const [response] = await ttsClient.synthesizeSpeech(request);
        return response.audioContent;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function processTTSQueue() {
    while (true) {
        if (!data.ttsQueue.isEmpty() && !data.ttsPlaying) {
            console.log("TTS queue not empty, sending next message.");
            var chat = data.ttsQueue.dequeue();
            let tts = await getTTS(chat);
            if (tts) {
                io.emit("ttsReady", { chat: chat, mp3: tts }, { binary: true });
                data.ttsPlaying = true;
            } else {
                console.log("TTS failed, skipping.");
            }
        }
        await sleep(1000);
    }
}

// Express GET requests
app.get("/", (req, res) => {
    res.render("index");
});

// Express GET request sending the user to a settings page
app.get("/settings", (req, res) => {
    res.render("settings");
});

io.on('connection', (socket) => {
    const clientData = JSON.parse(socket.handshake.query.data);

    console.log(`Socket.IO: ${clientData.client} user has connected.`);
    if (clientData.client == "settings") {
        socket.emit('initSettingsData', {
            "savedSettings": data.config.savedSettings,
            "goalData": data.goalData,
            "youtubeChannelID": data.config.youtubeChannelID,
            "youtubeLivestreamID": data.config.youtubeLivestreamID,
            "youtubeAPIKey": data.config.youtubeAPIKey,
            "scoreSaberProfileLink": data.config.scoreSaberProfileLink,
            "pusloidWidgetLink": data.config.pusloidWidgetLink
        });
    }
    else if (clientData.client == "overlay") {
        socket.emit('initData', {
            "playerData": data.playerData,
            "goalData": data.goalData,
            "heartRate": data.heartRate,
            "config": data.config.savedSettings,
        });
        data.liveChatHistory.forEach(element => {
            socket.emit("liveChat", element);
        });
    }

    socket.on('updateOverlayElements', (updatedData) => {
        console.log("Overlay Elements updated.");

        data.config.savedSettings.enableBS = Boolean(updatedData.enableBS);
        data.config.savedSettings.enableHR = Boolean(updatedData.enableHR);
        data.config.savedSettings.enableSC = Boolean(updatedData.enableSC);
        data.config.savedSettings.enableLC = Boolean(updatedData.enableLC);

        io.emit('editOverlayElements', updatedData);

        saveSettings();
    });

    socket.on('updateLivestreamSettings', (updatedData) => {
        console.log("Livestream Settings updated.");

        if (data.subscriberGoal != Number(updatedData.subscriberGoal)) {
            io.emit("goalDataUpdate", { "current_amount": data.goalData.current_amount, "target_amount": Number(updatedData.subscriberGoal) });
        }
        data.subscriberGoal = Number(updatedData.subscriberGoal);
        data.youtubeChannelID = updatedData.youtubeChannelID;
        data.youtubeLivestreamID = updatedData.youtubeLivestreamID;

        saveSettings();
    });

    socket.on('updateGeneralSettings', (updatedData) => {
        console.log("General Settings updated.");

        data.youtubeAPIKey = updatedData.youtubeAPIKey;
        data.scoreSaberProfileLink = updatedData.scoreSaberProfileLink;
        data.pusloidWidgetLink = updatedData.pusloidWidgetLink;

        saveSettings();
    });

    socket.on('ttsEnded', () => {
        console.log("TTS ended.")
        data.ttsPlaying = false;
    });
});

// Express GET requests to send data from the server
app.get("/getTTS", (req, res) => {
    res.download("output.mp3");
});

// Refresh ScoreSaber rank data
const updatePlayerData = setInterval(function () {
    refreshPlayerData();
}, 60000);

// Refresh goal data from YouTube
const updateGoalData = setInterval(function () {
    refreshGoalData();
}, 30000);

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initial setup function
function setup() {
    console.log(asciiArt);
    initHeartRate(io);
    refreshGoalData();
    refreshPlayerData();
    initLiveChat(io);
    processTTSQueue();
};

function saveSettings() {
    var config = {
        "enableHeartRate": data.config.enableHeartRate,
        "enableBeatSaber": data.config.enableBeatSaber,
        "enableLiveChat": data.config.enableLiveChat,
        "enableSubscriberCount": data.config.enableSubscriberCount,
        "subscriberGoal": data.config.subscriberGoal,
        "youtubeChannelID": data.config.youtubeChannelID,
        "youtubeLivestreamID": data.config.youtubeLivestreamID,
        "youtubeAPIKey": data.config.youtubeAPIKey,
        "scoreSaberProfileLink": data.config.scoreSaberProfileLink,
        "pusloidWidgetLink": data.config.pusloidWidgetLink,
        "savedSettings": {
            "enableBS": data.config.savedSettings.enableBS,
            "enableHR": data.config.savedSettings.enableHR,
            "enableSC": data.config.savedSettings.enableSC,
            "enableLC": data.config.savedSettings.enableLC
        }
    };

    try {
        fs.writeFileSync("./config.json", JSON.stringify(config));
        console.log("Settings saved to disk.");
    } catch (err) {
        console.log(err);
    }
}

// Start the Express server
setup();
server.listen(PORT, () => console.log(`Server started.\n Overlay: http://localhost:${PORT}\n Settings: http://localhost:${PORT}/settings\n`));