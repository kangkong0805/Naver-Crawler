import { chromium, Browser, BrowserContext, Page } from "playwright";
import crawling from "../script/crawler";

const runTest = async () => {
  // 브라우저 열기
  const browser: Browser = await chromium.launch({ headless: false });

  // 새 컨텍스트 열기
  const context: BrowserContext = await browser.newContext();

  // 새 페이지 열기
  const page: Page = await context.newPage();

  // React 애플리케이션의 URL로 이동
  await page.goto("http://localhost:3000");

  const button = page.locator("button");
  await page.waitForTimeout(5000);
  // 버튼을 찾아서 클릭
  await page.click("button");
  await crawling();

  // 스크린샷 찍기
  await page.screenshot({ path: "screenshot.png" });

  console.log("테스트 성공: 스크린샷 찍음");
  // 브라우저 닫기
  await browser.close();
};

runTest();
