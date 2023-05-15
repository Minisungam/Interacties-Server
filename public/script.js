var playerData;
var goalData;
var heartRate;
var liveChatObject;
var oldLiveChatObject;
var liveChatHTML;
var barProgress = 0;

// Convert enables strings to boolean
if (enableBS == "false") { enableBS = Boolean(false) }
else { enableBS = Boolean(true) }
if (enableSC == "false") { enableSC = Boolean(false) }
else { enableSC = Boolean(true) }
if (enableHR == "false") { enableHR = Boolean(false) }
else { enableHR = Boolean(true) }
if (enableLC == "false") { enableLC = Boolean(false) }
else { enableLC = Boolean(true) }

// Fetch playerData from server on an interval
const fetchPlayerData = setInterval(function() {
    $.getJSON('/getplayer', function(json) {
        playerData = json;
        $("#disUserName").html(playerData.name);
        $("#disRank").html(playerData.rank);
    });
}, 1000);

const fetchGoalData = setInterval(function() {
    $.getJSON('/getgoal', function(json) {
        goalData = json;
    });
}, 1000);

const fetchHeartRate = setInterval(function() {
    $.getJSON('/getheartrate', function(json) {
        heartRate = json.heartRate;
        $("#heartRateNumber").html(heartRate);
    });
}, 100);

const fetchLiveChat = setInterval(function() {
    $.getJSON('/getlivechat', function(json) {
        liveChatObject = json;
        if (liveChatObject !== oldLiveChatObject)
        {
            liveChatHTML = "";
            liveChatObject.liveChat.forEach(displayChat);
            $("#liveChat").html(liveChatHTML);
            oldLiveChatObject = liveChatObject;
        }
    });
}, 250);

function displayChat(item, index, arr) {
    liveChatHTML += "<div class=\"chatMessage\"><p class=\"chatUserName\">" + item.author.name + ": </p><p class=\"chatText\">" + item.message[0].text + "</p></div>";
}

init();

async function init() {
    await sleep(1200);
    fillFollowerBar();
}


$(document).ready(function() {
    // Animate rankBox
    if (enableBS) {
        const animateRankBox = setInterval(async function() {
            // Boxes moving onto screen
            if ($("#rankBox").hasClass("animate__backOutRight")) {
                $("#rankBox").addClass("animate__backInRight");
                $("#rankBox").removeClass("animate__backOutRight");
            }
            // Boxes moving off of screen
            else {
                $("#rankBox").addClass("animate__backOutRight");
                $("#rankBox").removeClass("animate__backInRight");
                await sleep(90000);
            }
        }, 30000);
    }

    // Animate follower goal box
    if (enableSC) {
        const animateSubscriberGoal = setInterval(async function() {
            // Boxes moving onto screen
            if ($("#subscriberGoal").hasClass("animate__backOutDown")) {
                $("#subscriberGoal").addClass("animate__backInUp");
                $("#subscriberGoal").removeClass("animate__backOutDown");
                fillFollowerBar();
            }
            // Boxes moving off of screen
            else {
                $("#subscriberGoal").addClass("animate__backOutDown");
                $("#subscriberGoal").removeClass("animate__backInUp");
                await sleep(90000);
            }
        }, 30000);
    }

    // Hide / show the heart rate monitor
    if (!enableHR) {
        $("#heartRate").css("display", "none");
    }

    if (enableLC) {
        $("#heartRate").css("bottom", "1.6em");
    } else {
        $("#liveChatBox").css("display", "none");
    }
});

// Animation for filling the follower bar
async function fillFollowerBar() {
    $("#subscriberGoal").removeClass("animate__pulse");
    await sleep(1200);
    for (let i = 0; i <= goalData.current_amount; i++) {
        $("#goalText").html(`Subscriber Goal ${i}/${goalData.target_amount}`);
        $("#goalProgress").css("width", ((i / goalData.target_amount) * 100) + "%");
        await sleep(30);
    }
    $("#subscriberGoal").addClass("animate__pulse");
}

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }