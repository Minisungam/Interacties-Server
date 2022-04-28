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
