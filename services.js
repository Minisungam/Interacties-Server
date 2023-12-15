const data = require("./data.js");
const puppeteer = require('puppeteer');
const { Masterchat, stringify } = require("@stu43005/masterchat");
const fetch = require("node-fetch");

// Initialize the YouTube live chat module
async function initLiveChat(io) {
    if (data.config.enableLiveChat) {
        const mc = await Masterchat.init("udf18vXkxEI");
        
        mc.on("chat", (chat) => {
            let simpleChat = chat.authorName + ": " + stringify(chat.message);
            console.log("Emitted message: " + simpleChat);
            data.liveChatHistory.push( { "authorName": chat.authorName, "message": stringify(chat.message) });
            io.emit("liveChat", { "authorName": chat.authorName, "message": stringify(chat.message) });
            chatQueue.enqueue(chat.authorName + " said, " + stringify(chat.message));
        });
          
        // Listen for any events
        //   See below for a list of available action types
        mc.on("actions", (actions) => {
            const chats = actions.filter(
                (action) => action.type === "addChatItemAction"
            );
            const superChats = actions.filter(
                (action) => action.type === "addSuperChatItemAction"
            );
            const superStickers = actions.filter(
                (action) => action.type === "addSuperStickerItemAction"
            );
        });
        
        // Handle errors
        mc.on("error", (err) => {
            console.log(err.code);
            // "disabled" => Live chat is disabled
            // "membersOnly" => No permission (members-only)
            // "private" => No permission (private video)
            // "unavailable" => Deleted OR wrong video id
            // "unarchived" => Live stream recording is not available
            // "denied" => Access denied (429)
            // "invalid" => Invalid request
        });
        
        // Handle end event
        mc.on("end", () => {
            console.log("Live stream has ended");
        });
        
        // Start polling live chat API
        mc.listen();
    }
}

// Scrape heart rate information from Pulsoid
async function initHeartRate(io) {
    if (data.config.enableHeartRate) {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        page.setDefaultTimeout(0);

        await page.goto(data.config.pusloidWidgetLink);
        console.log("Navigated to the Pulsoid widget page.");

        selector = "text";

        // Wait for the text element to appear on the page
        try {
            await page.waitForSelector(selector).catch("HR timeout. Not using it?");
        } catch (error) {
            console.log("HR timeout. Not using it?");
            return;
        }

        // Find the heart rate information by its element name 
        // (The ID changes on each load, and it's the only text element)
        const heartRateElement = await page.$(selector, { timeout: 300 });

        // Get the initial value of the element
        data.heartRate = await heartRateElement.evaluate(el => el.innerHTML);
        console.log("HR found, first value: " + data.heartRate);

        // Continuously monitor the element for changes
        while (data.config.enableHeartRate) {
            // Update heart rate
            let newValue = await heartRateElement.evaluate(el => el.innerHTML);

            if (newValue != data.heartRate) {
                data.heartRate = newValue;
                io.emit("heartRate", newValue);
            }
        
            // Wait and check again
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        await browser.close();
    }
}

// Refresh goal data from Youtube
async function refreshGoalData() {
    await fetch("https://www.googleapis.com/youtube/v3/channels?id=" + data.config.youtubeChannelID + "&key=" + data.config.youtubeAPIKey + "&part=statistics", { method: 'GET' })
    .then(res => res.json())
    .then((json) => {
        data.goalData.current_amount = Number(json.items[0].statistics.subscriberCount);
    });
}

// Refresh BeatSaver player information
async function refreshPlayerData() {
    await fetch(data.config.scoreSaberProfileLink, { method: 'GET' })
    .then(res => res.json())
    .then((json) => {
        data.playerData = json;
    });
}

module.exports = {
    initLiveChat: initLiveChat,
    initHeartRate: initHeartRate,
    refreshGoalData: refreshGoalData,
    refreshPlayerData: refreshPlayerData
}