const postSettings = {
    url: '/getplayer',
    method: 'POST',
}

var playerData;

// fetch playerData from server on an interval
const fetchData = setInterval(function() {
    $.getJSON('/getplayer', function(json) {
        playerData = json;
        $("#disUserName").html(playerData.name);
        $("#disRank").html(playerData.rank);
    });
}, 1000);

// animate rankBox
const animateRankBox = setInterval(function() {
    if ($("#rankBox").hasClass("animate__backOutRight")) {
        $("#rankBox").addClass("animate__backInRight");
        $("#rankBox").removeClass("animate__backOutRight");
    }
    else {
        $("#rankBox").addClass("animate__backOutRight");
        $("#rankBox").removeClass("animate__backInRight");
        setTimeout(function() {}, 90000)
}
}, 60000);