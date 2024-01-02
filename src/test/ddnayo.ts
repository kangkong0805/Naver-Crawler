import { APIResponse, Page } from "playwright";
import { retry } from "../config/retry";
import loadGoogleSheet from "../config/spreadsheet";
import { waitForRandomTimeout } from "../config/waitForRandomTimeout";

export const ddnayo = async (page: Page) => {
  console.log("ddnayo 크롤링 시작");
  try {
    const data = [];
    const phoneList: string[] = [];

    const dataSheet = await loadGoogleSheet("떠나요 test", [
      "업장ID",
      "업장명",
      "숙박타입",
      "행정구역",
      "위치",
      "판매자전화번호",
      "판매자이름",
    ]);
    if (!dataSheet) return console.log("구글 스프레드 시트 못 가져옴");
    let dataSheetRowCount = (await dataSheet.getRows()).length - 1;

    await page.goto(
      "https://trip.ddnayo.com/regional?area=0000&theme=&pageNumber=1&orderBy=recommend"
    );

    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    const numberElement = await page.$("span.jss120");
    const numberText = await page.evaluate(
      (numberElement) => numberElement?.textContent,
      numberElement
    );
    if (!numberText) return;
    const number = parseInt(numberText.replace(/,/g, ""), 10);
    const pageNumber = number / 24 + 1;

    const responseHandler = async (url: string) => {
      const responsePromise = await page.waitForResponse(
        (response) =>
          response.url().startsWith(url) && response.status() === 200
      );
      if (responsePromise.url().startsWith(url)) return responsePromise.json();
    };

    for (let i = 1; i <= pageNumber; i++) {
      await page.waitForTimeout(1000);
      await page.goto(
        `https://trip.ddnayo.com/regional?area=0000&theme=&pageNumber=${i}&orderBy=recommend`
      );

      const req: APIResponse = await page.request.post(
        "https://trip.ddnayo.com/web-api/regional",
        {
          data: {
            page: i.toString(),
            size: 24,
            area: "0000",
            theme: [],
            orderBy: "recommend",
          },
        }
      );
      const {
        data: { contents },
      } = await req.json();
      if (!contents) return;
      for (const content of contents) {
        await page.goto(content.productUrl);

        const { data: pensionInfo } = await responseHandler(
          `https://booking.ddnayo.com/booking-calendar-api/accommodation/${content.accommodationId}`
        );

        await page.waitForLoadState("domcontentloaded");
        await page.waitForLoadState("networkidle");

        await waitForRandomTimeout(page);
        let address, phone: string;
        try {
          const addressElement = await page.$('dt:has-text("주소") + dd');
          address = await page.evaluate(
            (element) => element?.textContent,
            addressElement
          );
        } catch (error) {
          console.error("주소를 가져오는 중 에러 발생:", error);
          continue;
        }
        try {
          const phoneElement = await page.$('dt:has-text("연락처") + dd');
          phone =
            (await page.evaluate(
              (element) => element?.textContent,
              phoneElement
            )) ?? "";
        } catch (error) {
          console.error("연락처를 가져오는 중 에러 발생:", error);
          continue;
        }
        const cleanedAddress = address?.replace("지도 보기", "").trim();

        const duplicatePhone = phoneList.find(
          (_, idx) => phoneList[idx] === phone
        );
        if (!duplicatePhone) continue;

        phoneList.push(phone);

        const obj = {
          id: pensionInfo.accommodationId,
          name: pensionInfo.accommodationName,
          stayType: "펜션",
          largeLocation: pensionInfo.addr1,
          address: cleanedAddress,
          phone: phone,
          sellerName: pensionInfo.repName,
        };

        dataSheet.addRow(Object.values(obj), { raw: true });
        data.push(obj);

        await page.goBack();
      }

      if (dataSheetRowCount > 0) dataSheetRowCount -= contents.length;
      if (dataSheetRowCount <= 0) dataSheetRowCount = 0;
    }
  } catch (e) {
    console.log("---ddnayo---");
    console.log(e);
    console.log("------------");
  } finally {
    await page.close();
  }
};
