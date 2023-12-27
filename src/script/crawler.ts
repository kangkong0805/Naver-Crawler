import { Page, chromium } from "playwright";
import { dailyHotel, ddnayo, yanolja, yeogieottae } from "../test/index";

const crawling = async () => {
  console.log('test console')
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  const otaCrawler = async <T>(func: (page: Page) => T) => {
    const page = await context.newPage();
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
