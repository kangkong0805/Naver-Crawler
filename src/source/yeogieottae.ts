import { chromium } from "playwright";
import loadGoogleSheet from "../config/spreadsheet";

(async () => {
  const browser = await chromium.launch({ headless: false }); // Or 'firefox' or 'webkit'.
  const context = await browser.newContext();
  const page = await context.newPage();

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
})();
