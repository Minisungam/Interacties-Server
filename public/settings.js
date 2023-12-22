let config = {
    enableBS: false,
    enableSC: false,
    enableHR: false,
    enableLC: false,
    subscriberGoal: 0,
    youtubeChannelID: "",
    youtubeAPIKey: "",
    scoreSaberProfileLink: "",
    pusloidWidgetLink: ""
};

const socket = io("http://localhost:5500", {
    query: {
        data: JSON.stringify({client: "settings"})
    }
});

socket.on("connect", () => {
    console.log("Socket.IO: Connected.");
});

socket.on("initSettingsData", (data) => {
    console.log(data);

    config.enableBS = data.savedSettings.enableBS;
    config.enableSC = data.savedSettings.enableSC;
    config.enableHR = data.savedSettings.enableHR;
    config.enableLC = data.savedSettings.enableLC;
    config.subscriberGoal = data.goalData.target_amount;
    config.youtubeChannelID = data.youtubeChannelID;
    config.youtubeAPIKey = data.youtubeAPIKey;
    config.scoreSaberProfileLink = data.scoreSaberProfileLink;
    config.pusloidWidgetLink = data.pusloidWidgetLink;

    $("#beat-saber").prop("checked", config.enableBS);
    $("#heart-rate").prop("checked", config.enableHR);
    $("#subscriber-count").prop("checked", config.enableSC);
    $("#live-chat").prop("checked", config.enableLC);
    $("#subscriber-goal").val(config.subscriberGoal);
    $("#youtube-channel-id").val(config.youtubeChannelID);
    $("#youtube-api-key").val(config.youtubeAPIKey);
    $("#score-saber-api-profile-link").val(config.scoreSaberProfileLink);
    $("#pusloid-widget-link").val(config.pusloidWidgetLink);
});

function submitData() {
    console.log("Socket state:", socket ? (socket.connected ? "Connected" : "Connecting") : "Not initialized");

    config.enableBS = $("#beat-saber").prop("checked");
    config.enableHR = $("#heart-rate").prop("checked");
    config.enableSC = $("#subscriber-count").prop("checked");
    config.enableLC = $("#live-chat").prop("checked");
    config.subscriberGoal = $("#subscriber-goal").val();
    config.youtubeChannelID = $("#youtube-channel-id").val();
    config.youtubeAPIKey = $("#youtube-api-key").val();
    config.scoreSaberProfileLink = $("#score-saber-api-profile-link").val();
    config.pusloidWidgetLink = $("#pusloid-widget-link").val();

    if (socket && socket.connected) {
        console.log("Settings updating.");
        socket.emit("updateSettings", config);
    }
    else {
        console.log("Socket.IO: Not connected.");
    }
}