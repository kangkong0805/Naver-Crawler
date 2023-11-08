import { test } from "@playwright/test";
import loadGoogleSheet from "../config/spreadsheet";

test.describe.configure({ mode: "parallel" });

test("야놀자", async ({ page, request }) => {
  test.setTimeout(99999999);
  page.setDefaultNavigationTimeout(99999999);
  page.setDefaultTimeout(99999999);

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
});

test("여기어떄", async ({ page }) => {
  page.setDefaultTimeout(99999999);
  test.setTimeout(99999999);

  const doc = await loadGoogleSheet("여기어때", [
    "업장ID",
    "업장명",
    "숙박타입",
    "주소",
    "사업자등록번호",
    "판매자이름",
    "판매자전화번호",
    "판매자이메일",
  ]);
  if (!doc) return;

  const dataSheetRows = await doc.getRows();
  let dataSheetRowCount = dataSheetRows.length;

  const data: object[] = [];
  let emailList: string[] = [];
  const typeHouse = [
    "list_1",
    "list_2.adcno2",
    "list_2.adcno3",
    "list_4.adcno6",
    "list_2.adcno5",
  ];
  const linkHouse = [
    "https://www.goodchoice.kr/product/home/1", // 모텔
    "https://www.goodchoice.kr/product/search/2", // 호텔, 리조트
    "https://www.goodchoice.kr/product/search/3", // 펜션
    "https://www.goodchoice.kr/product/search/6", // 게스트하우스
    "https://www.goodchoice.kr/product/search/5", // 캠핑, 글램핑
  ];

  emailList = dataSheetRows.map((row) => {
    return row.get("판매자이메일");
  });

  for (let k = 0; k < 5; k++) {
    await page.goto(linkHouse[k]);
    const links = await page.$$eval(
      ".city_child li a",
      (anchors: HTMLAnchorElement[]) => anchors.map((a) => a.href)
    );
    for (let i = 1; i < links.length; i++) {
      await page.goto(links[i]);
      const items = await page.$$eval(`li.${typeHouse[k]} a`, (anchors) =>
        anchors.map((a) => a.getAttribute("href"))
      );
      console.log(links.length, dataSheetRowCount);
      if (items.length > dataSheetRowCount)
        for (let j = 0; j < items.length; j++) {
          await page.goto(items[j], { waitUntil: "domcontentloaded" });
          const currentUrl = new URL(page.url());
          const accommodationId = currentUrl.searchParams.get("ano") ?? "";
          const buttonSelector = "div.btn_center button";
          const button = await page.$(buttonSelector);
          if (button) {
            await button.click();
          } else {
            // console.log("해당 element가 발견되지 않았습니다. 클릭하지 않습니다.");
          }
          await page.click("text='숙소정보'");
          await page.click("text='판매자 정보'");
          const sellerInfoSection = await page.$("section.seller_info");

          const getSellerInfo = async (name: string) => {
            const sellerNameElement = await sellerInfoSection?.$(
              `h3:has-text("${name}") + ul li`
            );
            let sellerInfo: string;
            if (sellerNameElement) {
              sellerInfo =
                (await page.evaluate(
                  (element) => element.textContent,
                  sellerNameElement
                )) ?? "";
            } else {
              // console.log("대표자명 요소를 찾을 수 없습니다.");
              sellerInfo = "";
            }
            return sellerInfo;
          };

          const businessName = await getSellerInfo("상호");
          const sellerName = await getSellerInfo("대표자명");
          const address = await getSellerInfo("주소");
          const email = await getSellerInfo("이메일");
          const phone = await getSellerInfo("전화번호");
          const sellerNumber = await getSellerInfo("사업자번호");

          const getType = () => {
            switch (linkHouse[k].charAt(linkHouse[k].length - 1)) {
              case "1":
                return "모텔";
              case "2":
                return "호텔";
              case "3":
                return "펜션";
              case "6":
                return "게스트하우스";
              case "5":
                return "캠핑";
              default:
                return "";
            }
          };

          const duplicateEmail = emailList.find((item) => {
            return item === email;
          });

          if (!duplicateEmail) {
            emailList.push(email);
            const obj = {
              accommodationId: accommodationId,
              name: businessName,
              type: getType(),
              address: address,
              companyNumber: sellerNumber,
              sellerName: sellerName,
              phone: phone,
              sellerEmail: email,
            };
            data.push(obj);
            doc.addRow(Object.values(obj), { raw: true });
          }

          await page.goBack({ waitUntil: "domcontentloaded" });
        }
      if (dataSheetRowCount > 0) dataSheetRowCount -= links.length;
      if (dataSheetRowCount <= 0) dataSheetRowCount = 0;
    }
  }
});

test("떠나요", async ({ page }) => {
  page.setDefaultTimeout(99999999);
  test.setTimeout(99999999);
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
  const pageNumber = parseInt(number / 24) + 1;

  const responseHandler = async (url: string) => {
    const responsePromise = await page.waitForResponse(
      (response) => response.url().startsWith(url) && response.status() === 200
    );
    if (responsePromise.url().startsWith(url)) return responsePromise.json();
  };

  for (let i = 1; i <= pageNumber; i++) {
    await page.waitForTimeout(1000);
    await page.goto(
      `https://trip.ddnayo.com/regional?area=0000&theme=&pageNumber=${i}&orderBy=recommend`,
      { waitUntil: "domcontentloaded" }
    );
    const pensionList = await responseHandler(
      "https://trip.ddnayo.com/web-api/regional"
    );
    const { contents } = pensionList.data;

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
});
