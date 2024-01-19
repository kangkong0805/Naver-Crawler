import { chromium } from "../release/app/node_modules/playwright";

if (typeof document !== "undefined") {
  console.log("asdfsa");
  document = document;
  console.log(document);
}

const runTest = async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/");

  const go = async () => {
    await page.goto("https://www.google.com");

    await page.locator('input[name="q"]').fill("리액트");

    await page.keyboard.press("Enter");

    await page.screenshot({ path: "screenshot.png" });

    await browser.close();
  };
  await page.waitForTimeout(3000);
  const button = page.locator("button");
  if (typeof document !== "undefined") {
    document
      .getElementsByTagName("button")[0]
      .addEventListener("click", async (event) => {
        await go();
      });
  }
};

runTest();
