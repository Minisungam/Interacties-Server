const express = require("express");
const { Template } = require("ejs");
const fetch = require("node-fetch");
const { exec } = require("child_process");
var interacties = express();

interacties.set("view engine", "ejs");

interacties.use(express.static("public"));
interacties.use(express.urlencoded({ extended: false }));

// fetch settings for getting player info
const playerURL = "https://scoresaber.com/api/player/76561198048104357/basic";
const settings = { method: 'Get' };

// initial get follower goal information from twitch
var goalData;
exec("twitch api get goals -q broadcaster_id=27805442", (error, stdout, stderr) => {
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

// initial fetch of player data
var playerData;
fetch(playerURL, settings)
    .then(res => res.json())
    .then((json) => {
        playerData = json;
});

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
    fetch(playerURL, settings)
    .then(res => res.json())
    .then((json) => {
        playerData = json;
    })
}, 60000);

// refresh goal data from twitch cli
const updateGoalData = setInterval(function() {
    exec("twitch api get goals -q broadcaster_id=27805442", (error, stdout, stderr) => {
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
}, 5000);


interacties.listen(5500);
console.log("Executed normally: http://localhost:5500/");