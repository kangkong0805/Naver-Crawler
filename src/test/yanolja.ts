import loadGoogleSheet from "../config/spreadsheet";

export const yanolja = async (page) => {
  console.log("yanolja 크롤링 시작");

  const dataSheet = await loadGoogleSheet("야놀자 test", [
    "업장ID",
    "업장명",
    "숙박타입",
    "행정구역",
    "위치",
    "사업자등록번호",
    "판매자이름",
    "판매자전화번호",
    "판매자이메일",
  ]);
  if (!dataSheet) return console.log("구글 스프레드 시트 못 가져옴");
  const dataSheetRows = await dataSheet.getRows();
  let dataSheetRowCount = dataSheetRows.length;
  const accommodationList = ["hotel", "pension"];
  const regex = (accommodation) => new RegExp(`\/${accommodation}\/(\\\d+)`);
  let data: object[] = [];
  let emailList: string[] = [];

  emailList = dataSheetRows.map((row) => {
    return row.get("판매자이메일");
  });

  for (const accommodation of accommodationList) {
    await page.goto(`https://www.yanolja.com/sub-home/${accommodation}`);
    let choiceLocationBtn = page.getByRole("button", { name: "지역 선택" });
    await choiceLocationBtn.click();
    await page.waitForTimeout(1000);
    choiceLocationBtn = page.locator("section section > h2 > i");
    const locations = await page
      .locator("main > section > div > ul")
      .first()
      .locator("li")
      .all();

    for (const location of locations) {
      await page.waitForTimeout(1000);
      const locationText = await location.innerText();
      await location.click();
      const listOfLocationBtn = page.locator('a[data-depth="main"]').first();
      await listOfLocationBtn.click();

      const responseHandler = async (url: string) => {
        try {
          const responsePromise = await page.waitForResponse(
            (response) =>
              response.url().startsWith(url) && response.status() === 200,
            { timeout: 5000 }
          );
          if (responsePromise.url().startsWith(url))
            return responsePromise.json();
        } catch {
          return false;
        }
      };
      while (true) {
        await page.waitForTimeout(500);
        await page.mouse.wheel(0, 20000);

        const res = await responseHandler(
          "https://www.yanolja.com/api/v1/v7/contents/search"
        );
        if (!res) break;
      }

      const accommodationListUrl = page.url();

      await page.waitForLoadState();

      const links = await page.$$eval("a", (anchors: HTMLAnchorElement[]) =>
        anchors.map((a) => a.getAttribute("href"))
      );
      const motelNumbers = links
        .filter((link) => regex(accommodation).test(link)) // /motel/로 시작하는 링크만 필터링
        .map((link) => link.match(regex(accommodation))[1]); // 숫자만 추출하여 새로운 배열 생성

      if (motelNumbers.length > dataSheetRowCount)
        for (let j = dataSheetRowCount; j < motelNumbers.length; j++) {
          let obj = {};
          try {
            await page.goto(
              `https://place-site.yanolja.com/places/${motelNumbers[j]}`
            );

            await page.getByRole("link", { name: "위치/교통" }).click();

            const address = await page
              .locator(
                'h4 + div[data-testid="sub-content"] > div:nth-child(2) div',
                { hasNotText: "주소복사" }
              )
              .innerText();

            await page.waitForSelector('[data-swiper-slide-index="0"]');
            await page.waitForSelector('[data-testid="back-button"]');
            await page.getByText("판매자 정보").click();

            const nameElement = await page.waitForSelector(
              '.tableTypeRow div:has-text("대표자명") + div > div',
              { timeout: 5000 }
            );
            const name = await page.evaluate(
              (element) => element.textContent ?? "",
              nameElement
            );
            const companyNameElement = await page.waitForSelector(
              '.tableTypeRow div:has-text("상호명") + div > div',
              { timeout: 5000 }
            );
            const companyName = await page.evaluate(
              (element) => element.textContent ?? "",
              companyNameElement
            );
            const addressElement = await page.waitForSelector(
              '.tableTypeRow div:has-text("사업자주소") + div > div',
              { timeout: 5000 }
            );
            const emailElement = await page.waitForSelector(
              '.tableTypeRow div:has-text("전자우편주소") + div > div',
              { timeout: 5000 }
            );
            const email = await page.evaluate(
              (element) => element.textContent ?? "",
              emailElement
            );
            const phoneElement = await page.waitForSelector(
              '.tableTypeRow div:has-text("연락처") + div > div',
              { timeout: 5000 }
            );
            const phone = await page.evaluate(
              (element) => element.textContent ?? "",
              phoneElement
            );
            const registrationNumberElement = await page.waitForSelector(
              '.tableTypeRow div:has-text("사업자등록번호") + div > div',
              { timeout: 5000 }
            );
            const registrationNumber = await page.evaluate(
              (element) => element.textContent ?? "",
              registrationNumberElement
            );
            const getType = () => {
              switch (accommodation) {
                case "motel":
                  return "모텔";
                case "hotel":
                  return "호텔";
                case "pension":
                  return "펜션";
                case "guestHouse":
                  return "게스트하우스";
                default:
                  return "";
              }
            };
            const duplicateEmail = emailList.find((item) => {
              return item === email;
            });

            if (!duplicateEmail) {
              obj = {
                accommodationId: motelNumbers[j],
                name: companyName,
                type: getType(),
                largeLocation: locationText,
                address: address,
                companyNumber: registrationNumber,
                sellerName: name,
                sellerPhone: phone,
                sellerEmail: email,
              };
              data.push(obj);
              dataSheet.addRow(Object.values(obj), { raw: true });
            }

            console.log(`${accommodation} 크롤링 진행 상황`);
            console.log(`${locationText}의 총 데이터: ${motelNumbers.length}`);
            console.log(
              `${locationText}의 크롤링 진행률: ${
                ((j + 1) / motelNumbers.length) * 100
              }%`
            );
            console.log(
              `${locationText} 잔여 데이터: ${
                dataSheetRowCount === 0 ? 0 : motelNumbers.length - j - 1
              }\n`
            );

            await page.goBack();
          } catch (error) {
            console.error(`오류 발생!!`, error);
          } finally {
            await page.waitForTimeout(Math.random() * 250 + 250);
          }
        }
      if (dataSheetRowCount > 0) dataSheetRowCount -= motelNumbers.length;
      if (dataSheetRowCount <= 0) dataSheetRowCount = 0;
      await page.goto(accommodationListUrl, { waitUntil: "domcontentloaded" });
      await choiceLocationBtn.click();
    }
  }
};
