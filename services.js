import fetch from "node-fetch";
import sharedData from "./data.js";
import puppeteer from "puppeteer";
import { Masterchat, stringify } from "@stu43005/masterchat";

// Initialize the YouTube live chat module
async function initLiveChat(io) {
    if (sharedData.config.enableLiveChat) {
        const mc = await Masterchat.init(sharedData.config.youtubeLivestreamID);

        mc.on("chat", (chat) => {
            console.log(chat.authorName + ": " + stringify(chat.message));
            if (stringify(chat.message).substring(0, 1) == "!") {
                // TODO: Handle commands
                console.log("Command detected, ignoring.")
                return;
            }

            if (stringify(chat.message).substring(0, 4).toLowerCase() == "http") {
                console.log("URL detected, ignoring.")
                return;
            }

            sharedData.liveChatHistory.push({ "authorName": chat.authorName, "message": stringify(chat.message) });
            io.emit("liveChat", { "authorName": chat.authorName, "message": stringify(chat.message) });
            sharedData.ttsQueue.enqueue(chat.authorName + " said, " + stringify(chat.message));
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
            console.log("Masterchat Error: " + err.code);
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
    if (sharedData.config.enableHeartRate) {
        const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        page.setDefaultTimeout(0);

        await page.goto(sharedData.config.pusloidWidgetLink);
        console.log("Navigated to the Pulsoid widget page.");

        let selector = "text";

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
        sharedData.heartRate = await heartRateElement.evaluate(el => el.innerHTML);
        console.log("HR found, first value: " + sharedData.heartRate);
        io.emit("heartRate", sharedData.heartRate);

        // Continuously monitor the element for changes
        while (sharedData.config.enableHeartRate) {
            // Update heart rate
            let newValue = await heartRateElement.evaluate(el => el.innerHTML);

            if (newValue != sharedData.heartRate) {
                sharedData.heartRate = newValue;
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
    try {
        await fetch("https://www.googleapis.com/youtube/v3/channels?id=" + sharedData.config.youtubeChannelID + "&key=" + sharedData.config.youtubeAPIKey + "&part=statistics", { method: 'GET' })
            .then(res => res.json())
            .then((json) => {
                sharedData.goalData.current_amount = Number(json.items[0].statistics.subscriberCount);
            });
    } catch (error) {   
        console.log("Error refreshing goal data: " + error);
    }
}

// Refresh BeatSaver player information
async function refreshPlayerData() {
    try {
        await fetch(sharedData.config.scoreSaberProfileLink, { method: 'GET' })
            .then(res => res.json())
            .then((json) => {
                sharedData.playerData = json;
            });
    } catch (error) {
        console.log("Error refreshing player data: " + error);
    }
}

export { initLiveChat, initHeartRate, refreshGoalData, refreshPlayerData };