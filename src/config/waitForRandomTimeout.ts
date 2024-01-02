import { Page } from "playwright";

export const waitForRandomTimeout = (page: Page) => {
  page.waitForTimeout(Math.random() * 250 + 250);
};
