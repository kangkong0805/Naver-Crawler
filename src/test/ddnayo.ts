import { retry } from "../config/retry";
import loadGoogleSheet from "../config/spreadsheet";

export const ddnayo = async (page) => {
  const data = [];
  await page.goto(
    "https://trip.ddnayo.com/regional?area=0000&theme=&pageNumber=1&orderBy=recommend"
  );
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

  const numberElement = await page.$("span.jss120");
  const numberText = await page.evaluate(
    (numberElement) => numberElement.textContent,
    numberElement
  );
  const number = parseInt(numberText.replace(/,/g, ""), 10);
  const pageNumber = number / 24 + 1;

  const responseHandler = async (url: string) => {
    const responsePromise = await page.waitForResponse(
      (response) => response.url().startsWith(url) && response.status() === 200
    );
    if (responsePromise.url().startsWith(url)) return responsePromise.json();
  };

  for (let i = 1; i <= pageNumber; i++) {
    await page.waitForTimeout(1000);
    let pensionList, contents;
    await retry(async () => {
      await page.goto(
        `https://trip.ddnayo.com/regional?area=0000&theme=&pageNumber=${i}&orderBy=recommend`
      );
      pensionList = await responseHandler(
        "https://trip.ddnayo.com/web-api/regional"
      );
      contents = pensionList.data.contents;
    });

    await page.waitForTimeout(1000);
    const links = await page.$$eval(
      "li.jss79 a div.jss83 div.jss85",
      (anchors) => anchors.map((a) => a.textContent)
    );
    if (links.length > dataSheetRowCount)
      for (let i = dataSheetRowCount; i < links.length; i++) {
        const linkText = links[i] ?? "";
        await page.click(`text=${linkText}`);
        const { data: pensionInfo } = await responseHandler(
          `https://booking.ddnayo.com/booking-calendar-api/accommodation/${contents[i].accommodationId}`
        );
        await page.waitForTimeout(1000);
        let address, phone;
        try {
          const addressElement = await page.$('dt:has-text("주소") + dd');
          address = await page.evaluate(
            (element) => element.textContent,
            addressElement
          );
        } catch (error) {
          console.error("주소를 가져오는 중 에러 발생:", error);
          continue;
        }
        try {
          const phoneElement = await page.$('dt:has-text("연락처") + dd');
          phone = await page.evaluate(
            (element) => element.textContent,
            phoneElement
          );
        } catch (error) {
          console.error("연락처를 가져오는 중 에러 발생:", error);
          continue;
        }
        const cleanedAddress = address.replace("지도 보기", "").trim();
        const obj = {
          id: contents[i].accommodationId,
          name: linkText,
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

    if (dataSheetRowCount > 0) dataSheetRowCount -= links.length;
    if (dataSheetRowCount <= 0) dataSheetRowCount = 0;
  }
};
