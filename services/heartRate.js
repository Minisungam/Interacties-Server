import puppeteer from "puppeteer";
import sharedData from "../entities/data.js";

// Scrape heart rate information from Pulsoid
async function initHeartRate(io) {
  if (sharedData.config.enableHeartRate) {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
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
    sharedData.heartRate = await heartRateElement.evaluate(
      (el) => el.innerHTML,
    );
    console.log("HR found, first value: " + sharedData.heartRate);
    io.emit("heartRate", sharedData.heartRate);

    // Continuously monitor the element for changes
    while (sharedData.config.enableHeartRate) {
      // Update heart rate
      let newValue = await heartRateElement.evaluate((el) => el.innerHTML);

      if (newValue != sharedData.heartRate) {
        sharedData.heartRate = newValue;
        io.emit("heartRate", newValue);
      }

      // Wait and check again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await browser.close();
  }
}

export { initHeartRate };
