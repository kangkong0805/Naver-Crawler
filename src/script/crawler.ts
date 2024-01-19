import {
  Browser,
  BrowserContext,
  Page,
  chromium,
} from "../release/app/node_modules/playwright";
import { dailyHotel, ddnayo, yanolja, yeogieottae } from "../test/index";

const crawling = async () => {
  const browser: Browser = await chromium.launch({ headless: false });
  const context: BrowserContext = await browser.newContext();

  const otaCrawler = async <T>(func: (page: Page) => T) => {
    const page: Page = await context.newPage();
    page.setDefaultTimeout(99999999);
    page.setDefaultNavigationTimeout(99999999);
    func(page);
  };

  otaCrawler(dailyHotel);
  otaCrawler(yanolja);
  otaCrawler(yeogieottae);
  otaCrawler(ddnayo);
};

export default crawling;
