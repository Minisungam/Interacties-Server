// Christopher Magnus 2022

// imports
const express = require("express");
const { Template } = require("ejs");
const fetch = require("node-fetch");
const { exec } = require("child_process");
const fs = require("fs");

var interacties = express();

// read config file
var config = JSON.parse(fs.readFileSync("./config.json", "UTF-8"));

interacties.set("view engine", "ejs");

interacties.use(express.static("public"));
interacties.use(express.urlencoded({ extended: false }));

// fetch settings for getting player info
const playerURL = config.scoreSaberProfileLink;
const settings = { method: 'Get' };

// data that gets refreshed
var playerData;
var goalData;

// data that gets caught once
var broadcasterId;

// get broadcasterId from twitch api
async function getBroadcasterId() {
    exec(`twitch api get users -q login=${config.twitchUserName}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        var parsedOut = JSON.parse(stdout);
        broadcasterId = parsedOut.data[0].id;
    });
}

// functions to refresh data
async function refreshGoalData() {
    exec(`twitch api get goals -q broadcaster_id=${broadcasterId}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        var parsedOut = JSON.parse(stdout);
        goalData = parsedOut.data;
    });
}


async function refreshPlayerData() {
    await fetch(playerURL, settings)
    .then(res => res.json())
    .then((json) => {
        playerData = json;
    });
}

// initial setup function
async function initData() {
    await getBroadcasterId();
    await refreshGoalData();
    await refreshPlayerData();
}

initData();

// express GET requests
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

// refresh playerdata every minute
const updatePlayerData = setInterval(function() {
    refreshPlayerData();
}, 60000);

// refresh goal data from twitch
const updateGoalData = setInterval(function() {
    refreshGoalData();
}, 15000);


interacties.listen(5500);
console.log("Executed normally: http://localhost:5500/");