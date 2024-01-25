let config = {
    enableBS: false,
    enableSC: false,
    enableHR: false,
    enableLC: false,
    subscriberGoal: 0,
    youtubeChannelID: "",
    youtubeLiveStreamID: "",
    youtubeAPIKey: "",
    scoreSaberProfileLink: "",
    pusloidWidgetLink: ""
};

const socket = io(`http://${window.location.hostname}:5500`, {
    query: {
        data: JSON.stringify({ client: "settings" })
    }
});

socket.on("connect", () => {
    console.log("Socket.IO: Connected.");
});

socket.on("initSettingsData", (data) => {
    config.enableBS = data.savedSettings.enableBS;
    config.enableSC = data.savedSettings.enableSC;
    config.enableHR = data.savedSettings.enableHR;
    config.enableLC = data.savedSettings.enableLC;
    config.subscriberGoal = data.goalData.target_amount;
    config.youtubeChannelID = data.youtubeChannelID;
    config.youtubeLivestreamId = data.youtubeLivestreamID;
    config.youtubeAPIKey = data.youtubeAPIKey;
    config.scoreSaberProfileLink = data.scoreSaberProfileLink;
    config.pusloidWidgetLink = data.pusloidWidgetLink;

    $("#showBeatSaber").prop("checked", config.enableBS);
    $("#showHeartRate").prop("checked", config.enableHR);
    $("#showSubscriberCount").prop("checked", config.enableSC);
    $("#showLiveChat").prop("checked", config.enableLC);
    $("#subscriberGoal").val(config.subscriberGoal);
    $("#youtubeChannelId").val(config.youtubeChannelID);
    $("#youtubeLivestreamId").val(config.youtubeLivestreamId);
    $("#youtubeApiKey").val(config.youtubeAPIKey);
    $("#scoreSaberApiProfileLink").val(config.scoreSaberProfileLink);
    $("#pusloidWidgetLink").val(config.pusloidWidgetLink);
});

function setOverlayElements() {
    console.log("Socket state:", socket ? (socket.connected ? "Connected" : "Connecting") : "Not initialized");

    config.enableBS = $("#showBeatSaber").prop("checked");
    config.enableHR = $("#showHeartRate").prop("checked");
    config.enableSC = $("#showSubscriberCount").prop("checked");
    config.enableLC = $("#showLiveChat").prop("checked");

    overlayElements = {
        enableBS: config.enableBS,
        enableHR: config.enableHR,
        enableSC: config.enableSC,
        enableLC: config.enableLC
    };

    if (socket && socket.connected) {
        console.log("Overlay Elements updating.");
        socket.emit("updateOverlayElements", overlayElements);
    }
    else {
        console.log("Socket.IO: Not connected.");
    }
}

function setLivestreamSettings() {
    console.log("Socket state:", socket ? (socket.connected ? "Connected" : "Connecting") : "Not initialized");

    config.subscriberGoal = $("#subscriberGoal").val();
    config.youtubeChannelID = $("#youtubeChannelId").val();
    config.youtubeLivestreamId = $("#youtubeLivestreamId").val();

    livestreamSettings = {
        subscriberGoal: config.subscriberGoal,
        youtubeChannelID: config.youtubeChannelID,
        youtubeLivestreamId: config.youtubeLivestreamId
    };

    if (socket && socket.connected) {
        console.log("Livestream Settings updating.");
        socket.emit("updateLivestreamSettings", livestreamSettings);
    }
    else {
        console.log("Socket.IO: Not connected.");
    }
}

function setGeneralSettings() {
    console.log("Socket state:", socket ? (socket.connected ? "Connected" : "Connecting") : "Not initialized");

    config.youtubeAPIKey = $("#youtubeApiKey").val();
    config.scoreSaberProfileLink = $("#scoreSaberApiProfileLink").val();
    config.pusloidWidgetLink = $("#pusloidWidgetLink").val();

    generalSettings = {
        youtubeApiKey: config.youtubeAPIKey,
        scoreSaberProfileLink: config.scoreSaberProfileLink,
        pusloidWidgetLink: config.pusloidWidgetLink
    };

    if (socket && socket.connected) {
        console.log("General Settings updating.");
        socket.emit("updateGeneralSettings", generalSettings);
    }
    else {
        console.log("Socket.IO: Not connected.");
    }
}