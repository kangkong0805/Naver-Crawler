import { Page, Request, Route, Response } from "playwright";

const responseHandler = async (url: string, page: Page) => {
  const responsePromise = await page.waitForResponse(
    (response: Response) =>
      response.url().startsWith(url) && response.status() === 200
  );
  if (responsePromise.url().startsWith(url)) return responsePromise.json();
};

const requestHandler = (route: Route, request: Request) => {
  if (
    request.url().startsWith("https://map.naver.com/p/api/search/allSearch")
  ) {
    const requestUrl = new URL(request.url());
    // requestUrl.searchParams.set("page", "126.8757585;35.4930433");
    route.continue({ url: requestUrl.toString() });
  } else {
    route.continue();
  }
};
