import { Page, test } from "@playwright/test";
import * as OTA from "../script";

test.describe.configure({ mode: "parallel" });

let page: Page;

test.beforeEach(async ({ browser }) => {
  page = await browser.newPage();
  test.setTimeout(99999999);
  page.setDefaultNavigationTimeout(99999999);
  page.setDefaultTimeout(99999999);
});

test.afterEach(async () => {
  await page.close();
});

test.describe("ota 크롤러", () => {
  test("야놀자", async ({ page }) => OTA.yanolja(page));
  test("여기어때", async ({ page }) => OTA.yeogieottae(page));
  test("떠나요", async ({ page }) => OTA.ddnayo(page));
});
