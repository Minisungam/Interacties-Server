var enableBS=false, enableFG=true, enableHR=true;

var playerData;
var goalData;
var barProgress = 0;

// fetch playerData from server on an interval
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

init();

async function init() {
    await sleep(1200);
    fillFollowerBar();
}


$(document).ready(function() {
    // animate rankBox
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

    // animate follower goal box
    if (enableFG) {
        const animateFollowerGoal = setInterval(async function() {
            // Boxes moving onto screen
            if ($("#followerGoal").hasClass("animate__backOutDown")) {
                $("#followerGoal").addClass("animate__backInUp");
                $("#followerGoal").removeClass("animate__backOutDown");
                fillFollowerBar();
            }
            // Boxes moving off of screen
            else {
                $("#followerGoal").addClass("animate__backOutDown");
                $("#followerGoal").removeClass("animate__backInUp");
                await sleep(90000);
            }
        }, 30000);
    }

    // hide / show the heart rate monitor
    if (enableHR == false) {
        $("#heartRate").css("display", "none");
    }
});

// animation for filling the follower bar
async function fillFollowerBar() {
    $("#followerGoal").removeClass("animate__pulse");
    await sleep(1200);
    for (let i = 0; i <= goalData[0].current_amount; i++) {
        $("#goalText").html(`Follower Goal ${i}/${goalData[0].target_amount}`);
        $("#goalProgress").css("width", ((i / goalData[0].target_amount) * 100) + "%");
        await sleep(30);
    }
    $("#followerGoal").addClass("animate__pulse");
}

// sleep function because reasons
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }