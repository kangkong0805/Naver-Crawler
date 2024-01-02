import { Page } from "playwright";
import loadGoogleSheet from "../config/spreadsheet";

export const yeogieottae = async (page: Page) => {
  console.log("yeogieottae 크롤링 시작");
  try {
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
    const roomTypeCodeList = [
      "1", // 모텔
      "2", // 호텔, 리조트
      "3", // 펜션
      "6", // 게스트하우스
      "5", // 캠핑, 글램핑
    ];
    const localeList = [
      "서울",
      "경기",
      "인천",
      "부산",
      "경상",
      "충청",
      "전라",
      "제주",
      "대구",
      "대전",
      "광주",
      "울산",
      "세종",
      "강원",
    ];

    emailList = dataSheetRows.map((row) => {
      return row.get("판매자이메일");
    });

    for (const locale of localeList) {
      for (const roomTypeCode of roomTypeCodeList) {
        for (let pageIdx = 1; ; pageIdx++) {
          await page.goto(
            `https://www.yeogi.com/domestic-accommodations?keyword=${locale}&category=${roomTypeCode}&page=${pageIdx}&searchType=KEYWORD&freeForm=true`
          );
          await page.waitForLoadState("domcontentloaded");
          await page.waitForLoadState("networkidle");

          const links = await page.$$eval(
            "a[class*=thumbnail-type-seller-card]",
            (anchors: HTMLAnchorElement[]) => {
              console.log(anchors);
              return anchors.map((a) => {
                console.log(a.href);
                return a.href;
              });
            }
          );
          if (links.length === 0) break;

          for (let i = 1; i < links.length; i++) {
            await page.goto(links[i]);
            const currentUrl = new URL(page.url());
            const accommodationId = currentUrl.searchParams.get("ano") ?? "";
            const buttonSelector = "div.btn_center button";
            const button = await page.$(buttonSelector);
            if (button) {
              await button.click();
            } else {
              // console.log("해당 element가 발견되지 않았습니다. 클릭하지 않습니다.");
            }
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
              switch (roomTypeCode) {
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
            if (dataSheetRowCount > 0) dataSheetRowCount -= links.length;
            if (dataSheetRowCount <= 0) dataSheetRowCount = 0;
          }
        }
      }
    }
  } catch (e) {
    console.log("---yeogieottae---");
    console.log(e);
    console.log("-----------------");
  } finally {
    page.unroute("**/*");
    await page.close();
  }
};
