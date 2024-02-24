import Queue from "./queue.js";

const sharedData = {
    playerData: {},
    goalData: { current_amount: 0, target_amount: 0 },
    heartRate: 0,
    liveChatHistory: [],
    ttsQueue: new Queue(),
    ttsPlaying: false,
    config: {},
};

export default sharedData;