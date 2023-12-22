const Queue = require("./queue.js");

const sharedData = {
    playerData: {},
    goalData: { current_amount: 0, target_amount: 0 },
    heartRate: 0,
    liveChatHistory: [],
    ttsQueue: new Queue(),
    ttsPlaying: false,
    config: {},
};

module.exports = sharedData;