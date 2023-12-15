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
      input: {text: message},
      // Select the language and SSML voice gender (optional)
      voice: {name: 'en-US-Studio-O', languageCode: 'en-US', ssmlGender: 'FEMALE'},
      // Select the type of audio encoding
      audioConfig: {audioEncoding: 'MP3'},
    };
  
    // Performs the text-to-speech request
    const [response] = await ttsClient.synthesizeSpeech(request);

    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile('output.mp3', response.audioContent, 'binary');

    console.log('Audio content written to file: output.mp3');
}

chatQueue = new Queue();
const ttsQueue =  async () => {
    console.log("TTS queue handler started.");
    while (true) {
        if (!chatQueue.isEmpty()) {
            console.log("TTS queue not empty, playing next message.");
            var chat = chatQueue.dequeue();
            await getTTS(chat);
        }

        await sleep(1000);
    }   
}

// Express GET requests
app.get("/", (req,res) => {  
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
            "config": data.config,
        });
        data.liveChatHistory.forEach(element => {
            socket.emit("liveChat", element);
        });
    }

    socket.on('updateSettings', (updatedData) => {
        console.log("Settings updated.");
        console.log(updatedData);
    
        data.config.savedSettings.enableBS = updatedData.enableBS;
        data.config.savedSettings.enableHR = updatedData.enableHR;
        data.config.savedSettings.enableSC = updatedData.enableSC;
        data.config.savedSettings.enableLC = updatedData.enableLC;
        data.subscriberGoal = updatedData.subscriberGoal;
        data.youtubeChannelID = updatedData.youtubeChannelID;
        data.youtubeAPIKey = updatedData.youtubeAPIKey;
        data.scoreSaberProfileLink = updatedData.scoreSaberProfileLink;
        data.pusloidWidgetLink = updatedData.pusloidWidgetLink;

        saveSettings();
    });
});

// Express GET requests to send data from the server
app.get("/getTTS", (req, res) => {
        res.download("output.mp3");
});

// Refresh ScoreSaber rank data
const updatePlayerData = setInterval(function() {
    refreshPlayerData();
}, 60000);

// Refresh goal data from YouTube
const updateGoalData = setInterval(function() {
    refreshGoalData();
}, 30000);

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initial setup function
function setup() {
    initHeartRate(io);
    initLiveChat(io);
    refreshGoalData();
    refreshPlayerData();
    ttsQueue();
};

function saveSettings() {
    var config = {
        "enableHeartRate": data.config.enableHeartRate,
        "enableBeatSaber": data.config.enableBeatSaber,
        "enableLiveChat": data.config.enableLiveChat,
        "enableSubscriberCount": data.config.enableSubscriberCount,
        "subscriberGoal": data.subscriberGoal,
        "youtubeChannelID": data.youtubeChannelID,
        "youtubeAPIKey": data.youtubeAPIKey,
        "scoreSaberProfileLink": data.scoreSaberProfileLink,
        "pusloidWidgetLink": data.pusloidWidgetLink,
        "savedSettings": {
            "enableBS": data.config.savedSettings.enableHR,
            "enableHR": data.config.savedSettings.enableBS,
            "enableSC": data.config.savedSettings.enableLC,
            "enableLC": data.config.savedSettings.enableSC
        }
    };

    fs.writeFileSync("./config.json", JSON.stringify(config));
    console.log("Settings saved to disk.");
}

// Start the Express server
setup();
server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));