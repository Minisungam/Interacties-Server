import textToSpeech from "@google-cloud/text-to-speech";
import sharedData from "../entities/data.js";

// TTS Function
async function getTTS(message) {
  const ttsClient = new textToSpeech.TextToSpeechClient();

  // Construct the request
  const request = {
    input: { text: message },
    // Select the language and SSML voice gender (optional)
    voice: {
      name: "en-US-Studio-O",
      languageCode: "en-US",
      ssmlGender: "FEMALE",
    },
    // Select the type of audio encoding
    audioConfig: { audioEncoding: "MP3" },
  };

  try {
    // Performs the text-to-speech request
    const [response] = await ttsClient.synthesizeSpeech(request);
    return response.audioContent;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function processTTSQueue() {
  while (true) {
    if (!sharedData.ttsQueue.isEmpty() && !sharedData.ttsPlaying) {
      console.log("TTS queue not empty, sending next message.");
      var chat = sharedData.ttsQueue.dequeue();
      let tts = await getTTS(chat);
      if (tts) {
        io.emit("ttsReady", { chat: chat, mp3: tts }, { binary: true });
        sharedData.ttsPlaying = true;
      } else {
        console.log("TTS failed, skipping.");
      }
    }
    await sleep(1000);
  }
}

// Sleep function
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

export { getTTS, processTTSQueue };
