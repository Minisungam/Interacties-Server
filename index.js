const {JSDOM} = require("jsdom");
const {window} = new JSDOM("");
const $ = require("jquery")(window);

// Run scoreSaber function every minute
const updateScoreSaberTimer = setInterval(function() {
    scoreSaber();
}, 60000);

// Get ScoreSaber player info and 
function scoreSaber() {
    var player = $.getJSON('https://scoresaber.com/api/player/76561198048104357/basic', function(data) {return data;});

    console.log(player);

    console.log(player.name);
    console.log(player.rank);
    console.log(player.countryRank);
}