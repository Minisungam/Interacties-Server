// Christopher Magnus 2023
// CC BY-NC-ND 4.0

// Imports
const express = require("express");
const fetch = require("node-fetch");
const puppeteer = require('puppeteer');
const fs = require("fs");
const { LiveChat } = require("youtube-chat");

// Express Setup
var interacties = express();

interacties.set("view engine", "ejs");
interacties.use(express.static("public"));
interacties.use(express.urlencoded({ extended: false }));

// Read config file
var config = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));

// Fetch settings
var liveChat = null;
liveChat = new LiveChat({ channelId: config.youtubeChannelID });
liveChat.on("error", (error) => {
    console.log("LiveChat Error: Are you live?");
    liveChatEnabled = false;
});

// Data that gets refreshed
var playerData;
var goalData = { current_amount: 0, target_amount: config.subscriberGoal };
var heartRateData = { heartRate: 0 };
var liveChatObject = { liveChat: [] };


// Refresh goal data from Youtube
async function refreshGoalData() {
    await fetch("https://www.googleapis.com/youtube/v3/channels?id=" + config.youtubeChannelID + "&key=" + config.youtubeAPIKey + "&part=statistics", { method: 'GET' })
    .then(res => res.json())
    .then((json) => {
        goalData.current_amount = json.items[0].statistics.subscriberCount;
    });
}

// Refresh BeatSaver player information
async function refreshPlayerData() {
    await fetch(config.scoreSaberProfileLink, { method: 'GET' })
    .then(res => res.json())
    .then((json) => {
        playerData = json;
    });
}

// Initialize the YouTube live chat module
async function initLiveChat() {
    if (config.enableLiveChat) {
        var chat = await liveChat.start();
        if (!chat) {
            console.log("Failed to start LiveChat");
            return;
        } else {
            console.log("LiveChat started successfully");
            liveChat.on("chat", (chatItem) => {
                liveChatObject.liveChat.push(chatItem);

                if (liveChatObject.liveChat.length > 5) {
                    liveChatObject.liveChat.shift();
                }
            });
        }
    }
}

// Scrape heart rate information from Pulsoid
async function initHeartRate() {
    if (config.enableHeartRate) {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        page.setDefaultTimeout(0);

        await page.goto(config.pusloidWidgetLink);
        console.log("Navigated to the Pulsoid widget page.");

        selector = "text";

        // Wait for the text element to appear on the page
        try {
            await page.waitForSelector(selector).catch("HR timeout. Not using it?");
        } catch (error) {
            console.log("HR timeout. Not using it?");
            return;
        }

        // Find the heart rate information by its element name 
        // (The ID changes on each load, and it's the only text element)
        const heartRateElement = await page.$(selector, { timeout: 300 });

        // Get the initial value of the element
        heartRateData.heartRate = await heartRateElement.evaluate(el => el.innerHTML);
        console.log("HR found, first value: " + heartRateData.heartRate);

        // Continuously monitor the element for changes
        setInterval(async () => {
            // Get the new value of the element
            let newValue = await heartRateElement.evaluate(el => el.innerHTML);

            // Update the internal variable with the new value
            heartRateData.heartRate = newValue;
        }, 100);

        // Keep the browser open indefinitely
        await new Promise(() => {});
    }
}

// Express GET requests
interacties.get("/", (req,res) => {  
    var enableBS = req.query.enableBS, enableSC = req.query.enableSC, enableHR = req.query.enableHR, enableLC = req.query.enableLC;
    if (req.query.enableBS == undefined) {enableBS = true}
    if (req.query.enableSC == undefined) {enableSC = true}
    if (req.query.enableHR == undefined) {enableHR = true}
    if (req.query.enableLC == undefined) {enableLC = true}
    res.render("index", {
        enableBS: enableBS,
        enableSC: enableSC,
        enableHR: enableHR,
        enableLC: enableLC
    });
});

// Express GET request sending the user to a settings page
// Settings page is filled in with the current config values
interacties.get("/settings", (req, res) => {
    if (req.query.enableBS == undefined) {req.query.enableBS = config.enableBeatSaber}
    if (req.query.enableSC == undefined) {req.query.enableSC = config.enableSubscriberCount}
    if (req.query.enableHR == undefined) {req.query.enableHR = config.enableHeartRate}
    if (req.query.enableLC == undefined) {req.query.enableLC = config.enableLiveChat}
    if (req.query.scoreSaberProfileLink == undefined) {req.query.scoreSaberProfileLink = config.scoreSaberProfileLink}
    if (req.query.youtubeChannelID == undefined) {req.query.youtubeChannelID = config.youtubeChannelID}
    if (req.query.youtubeAPIKey == undefined) {req.query.youtubeAPIKey = config.youtubeAPIKey}
    if (req.query.pusloidWidgetLink == undefined) {req.query.pusloidWidgetLink = config.pusloidWidgetLink}
    res.render("settings", {
        enableBS: req.query.enableBS,
        enableSC: req.query.enableSC,
        enableHR: req.query.enableHR,
        enableLC: req.query.enableLC,
        scoreSaberProfileLink: req.query.scoreSaberProfileLink,
        youtubeChannelID: req.query.youtubeChannelID,
        youtubeAPIKey: req.query.youtubeAPIKey,
        pusloidWidgetLink: req.query.pusloidWidgetLink
    });
});

// Express GET requests to send data from the server
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

// Express POST request to get data from the settings page form
interacties.post("/setvalues", (req, res) => {
    let data = req.body;
    console.log(data);
    // Send user back to settings page
    res.redirect("/settings");
});


// Refresh ScoreSaber rank data
const updatePlayerData = setInterval(function() {
    refreshPlayerData();
}, 60000);

// Refresh goal data from YouTube
const updateGoalData = setInterval(function() {
    refreshGoalData();
}, 15000);

// Initial setup function
async function setup() {
    initHeartRate();
    initLiveChat();
    await refreshGoalData();
    await refreshPlayerData();
    //await refreshLiveChat();
};

// Start the Express server
interacties.listen(5500);
setup();
console.log("Executed normally: http://localhost:5500/");