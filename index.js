// Christopher Magnus 2022

// Imports
const express = require("express");
const { Template } = require("ejs");
const fetch = require("node-fetch");
const { exec } = require("child_process");
const puppeteer = require('puppeteer');
const fs = require("fs");
const { Console } = require("console");

var interacties = express();

// Read config file
var config = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));

interacties.set("view engine", "ejs");

interacties.use(express.static("public"));
interacties.use(express.urlencoded({ extended: false }));

// Fetch settings for getting player info
const playerURL = config.scoreSaberProfileLink;
const settings = { method: 'Get' };

// Data that gets refreshed
var playerData;
var goalData = { current_amount: 0, target_amount: 12 };
var heartRateData = { heartRate: 0 };

// Functions to refresh data
async function refreshGoalData() {
    await fetch("https://www.googleapis.com/youtube/v3/channels?id=" + config.youtubeChannelID + "&key=" + config.youtubeAPIKey + "&part=statistics", settings)
    .then(res => res.json())
    .then((json) => {
        goalData.current_amount = json.items[0].statistics.subscriberCount;
    });
}


async function refreshPlayerData() {
    await fetch(playerURL, settings)
    .then(res => res.json())
    .then((json) => {
        playerData = json;
    });
}

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.setDefaultTimeout(0);

    await page.goto(config.pusloidWidgetLink);

    // Wait for the span element to appear on the page
    await page.waitForSelector('span');

    // Find the span element by its tag name
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
  })();

// Initial setup function
async function initData() {
    await refreshGoalData();
    await refreshPlayerData();
}

initData();

// Express GET requests
interacties.get("/", (req,res) => {  
    var enableBS = req.query.enableBS, enableFG = req.query.enableFG, enableHR = req.query.enableHR;
    if (req.query.enableBS == undefined) {enableBS = true}
    if (req.query.enableFG == undefined) {enableFG = true}
    if (req.query.enableHR == undefined) {enableHR = true}
    res.render("index", {
        enableBS: enableBS,
        enableFG: enableFG,
        enableHR: enableHR
    });
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