import { test } from "@playwright/test";
import { payload } from "../config/payload";

/**
 * 스크립트 flow
 * 1. 네이버 지도에서 호텔/모텔/펜션/리조트 검색
 * 2. 검색한 데이터의 총량을 구해 페이지 값을 변경하며 반복
 * 3. 반복하는 동안 각 item의 상세정보를 크롤링
 * 4. 만약 "네이버 가격비교"가 있다면 탐색하여 ota 정보를 긁어온다.
 */

test("네이버", async ({ page, request }) => {
  page.setDefaultTimeout(99999999);
  test.setTimeout(99999999);

  try {
    const responseHandler = async (url: string) => {
      const responsePromise = await page.waitForResponse(
        (response) =>
          response.url().startsWith(url) && response.status() === 200
      );
      if (responsePromise.url().startsWith(url)) return responsePromise.json();
    };

    const requestHandler = (route, request) => {
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

    await page.route(
      "https://www.dailyhotel.com/newdelhi/goodnight/api/v10/stay/plp/*",
      requestHandler
    );

    await page.goto("https://map.naver.com/p/search/호텔?c=14.00,0,0,0,dh", {
      waitUntil: "domcontentloaded",
    });

    const res = await responseHandler(
      "https://map.naver.com/p/api/search/allSearch"
    );
    const { totalCount, page: pageIdx, list } = res.result.place;
    console.log(totalCount);

    for (let i = 0; i * 50 < totalCount; i += 1) {
      // page.goto(
      //   `https://map.naver.com/p/search/호텔/place/1080527262?c=13.00,0,0,0,dh&placePath=%3Fentry%253Dbmp`,
      //   { waitUntil: "domcontentloaded" }
      // );
      // const a = await page
      //   .locator(".place_section_content > div > div", { hasText: "투숙객" })
      //   .locator("span > span > span")
      //   .first();
      // console.log(a);
      const graphqlRes = await request.post(
        "https://pcmap-api.place.naver.com/graphql",
        {
          data: payload(i, "호텔"),
        }
      );
      console.log(graphqlRes);
      const dataOfPage = await graphqlRes.json();
      const listOfPage = dataOfPage[0].data.businesses.items;
      console.log(dataOfPage);
    }
  } catch (err) {
    console.log(err);
  }
});
