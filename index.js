// Christopher Magnus 2022

// Imports
const express = require("express");
const { Template } = require("ejs");
const fetch = require("node-fetch");
const puppeteer = require('puppeteer');
const fs = require("fs");
const { LiveChat } = require("youtube-chat");

var interacties = express();

// Enable variables
var liveChatEnabled = true;

// Read config file
var config = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));

interacties.set("view engine", "ejs");

interacties.use(express.static("public"));
interacties.use(express.urlencoded({ extended: false }));

// Fetch settings
const playerURL = config.scoreSaberProfileLink;
const settings = { method: 'GET' };
const liveChat = null;
try {
    liveChat = new LiveChat({ channelId: config.youtubeChannelID });
} catch {
    liveChatEnabled = false;
    console.log("LiveChat Error: Are you live?")
}

// Data that gets refreshed
var playerData;
var goalData = { current_amount: 0, target_amount: 15 };
var heartRateData = { heartRate: 0 };
var liveChatObject = { liveChat: [] };



// Refresh goal data from Youtube
async function refreshGoalData() {
    await fetch("https://www.googleapis.com/youtube/v3/channels?id=" + config.youtubeChannelID + "&key=" + config.youtubeAPIKey + "&part=statistics", settings)
    .then(res => res.json())
    .then((json) => {
        goalData.current_amount = json.items[0].statistics.subscriberCount;
    });
}

// Refresh BeatSaver player information
async function refreshPlayerData() {
    await fetch(playerURL, settings)
    .then(res => res.json())
    .then((json) => {
        playerData = json;
    });
}

// Refresh Youtube Live Chat information
async function refreshLiveChat() {
    if (liveChatEnabled) {
        const chat = await liveChat.start();
        if (!chat) {
            console.log("Failed to start LiveChat");
            return;
        } else {
            console.log("LiveChat started successfully");
            liveChat.on("chat", (chatItem) => {
                liveChatObject.liveChat.push(chatItem);
                console.log(chatItem);
            });
            if (liveChatObject.liveChat.length > 5)
            {
                liveChatObject.liveChat.shift();
            }
        }
    }
}


// Scrape heart rate information from Pulsoid
(async () => {
    if (liveChatEnabled) {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        page.setDefaultTimeout(0);

        await page.goto(config.pusloidWidgetLink);

        // Wait for the span element to appear on the page
        await page.waitForSelector('span').catch("HR timeout. Not using it?");

        // Find the heart rate information by its element name 
        // (The ID changes on each load, and it's the only span element)
        const spans = await page.$$('span');
        let span = spans[0];
    
        // Get the initial value of the element
        heartRateData.heartRate = await span.evaluate(el => el.innerText);
        console.log("HR found, first value: " + heartRateData.heartRate);
    
        // Continuously monitor the element for changes
        setInterval(async () => {
        // Get the new value of the element
        let newValue = await span.evaluate(el => el.innerText);
    
        // Update the internal variable with the new value
        heartRateData.heartRate = newValue;
        }, 100);
    
        // Keep the browser open indefinitely
        await new Promise(() => {});
    }
  })();

// Initial setup function
async function initData() {
    await refreshGoalData();
    await refreshPlayerData();
    await refreshLiveChat();
}

initData();

// Express GET requests
interacties.get("/", (req,res) => {  
    var enableBS = req.query.enableBS, enableFG = req.query.enableFG, enableHR = req.query.enableHR, enableLC = req.query.enableLC;
    if (req.query.enableBS == undefined) {enableBS = true}
    if (req.query.enableFG == undefined) {enableFG = true}
    if (req.query.enableHR == undefined) {enableHR = true}
    if (req.query.enableLC == undefined) {enableLC = true}
    res.render("index", {
        enableBS: enableBS,
        enableFG: enableFG,
        enableHR: enableHR,
        enableLC: enableLC
    });
});

interacties.get("/settings", (req,res) => {  
    res.render("settings");
});

interacties.get("/getplayer", (req, res) => {
    res.send(playerData);
});

interacties.get("/getgoal", (req, res) => {
    res.send(goalData);
});

interacties.get("/getheartrate", (req, res) => {
    res.send(heartRateData);
});

interacties.get("/getlivechat", (req, res) => {
    res.send(liveChatObject);
});

interacties.post("/setvalues", (req, res) => {
    let data = req.body;
    console.log(data);
    res.send('Data Received: ' + JSON.stringify(data));
});


// Refresh playerdata every minute
const updatePlayerData = setInterval(function() {
    refreshPlayerData();
}, 60000);

// Refresh goal data from YouTube
const updateGoalData = setInterval(function() {
    refreshGoalData();
}, 15000);

interacties.listen(5500);
console.log("Executed normally: http://localhost:5500/");