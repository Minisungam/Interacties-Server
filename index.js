const express = require("express");
const fetch = require("node-fetch");
var interacties = express();

interacties.use(express.static("public"));
interacties.use(express.urlencoded({ extended: false }));

// fetch for getting player info
const playerURL = "https://scoresaber.com/api/player/76561198048104357/basic";
const settings = { method: 'Get' };

var playerData;
fetch(playerURL, settings)
    .then(res => res.json())
    .then((json) => {
    playerData = json;
});

interacties.get("/", (req,res) => {
    res.render("index");
});

interacties.get("/getplayer", (req, res) => {
    res.send(playerData);
});

// refresh playerdata every minute
const updatePlayerData = setInterval(function() {
    fetch(playerURL, settings)
    .then(res => res.json())
    .then((json) => {
        playerData = json;
    })
}, 60000);

interacties.listen(5500);
console.log("Executed normally: http://localhost:5500/");