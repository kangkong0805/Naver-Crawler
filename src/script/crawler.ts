import { chromium } from "playwright";
import { dailyHotel, ddnayo, yanolja, yeogieottae } from "./index";

(async () => {
  const browser = await chromium.launch({ headless: true }); // Or 'firefox' or 'webkit'.
  const context = await browser.newContext();

  const crawler = async (ota) => {
    const page = await context.newPage();
    page.setDefaultTimeout(99999999);
    page.setDefaultNavigationTimeout(99999999);
    ota(page);
  };

  crawler(dailyHotel);
  crawler(yanolja);
  crawler(yeogieottae);
  crawler(ddnayo);
})();
