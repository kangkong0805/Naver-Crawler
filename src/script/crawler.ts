import { Page, chromium } from "playwright";
import { dailyHotel, ddnayo, yanolja, yeogieottae } from "../test/index";

const crawling = async () => {
  const browser = await chromium.launch({ headless: false });

  const otaCrawler = async <T>(func: (page: Page) => T) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await func(page);
  };
  while (true) {
    await Promise.all([
      otaCrawler(dailyHotel),
      otaCrawler(yanolja),
      otaCrawler(yeogieottae),
      otaCrawler(ddnayo),
    ]);
  }
};

export default crawling;
