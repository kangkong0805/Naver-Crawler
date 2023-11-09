import loadGoogleSheet from "../config/spreadsheet";
import { SellerInfoProps } from "../interface/sellerInfo";

export const dailyHotel = async (page) => {
  const getTodayDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month}-${day}`;
  };

  try {
    const dataSheet = await loadGoogleSheet("데일리호텔", [
      "업장ID",
      "업장명",
      "숙박타입",
      "행정구역",
      "세부지역",
      "사업자등록번호",
      "회사명",
      "판매자이름",
      "판매자전화번호",
      "판매자이메일",
    ]);
    if (!dataSheet) return;
    const dataSheetRows = await dataSheet.getRows();
    let dataSheetRowCount = dataSheetRows.length - 1; // 데이터들의 label이 있는 행은 제외합니다

    await page.goto("https://www.dailyhotel.com/", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(500);

    const hotelListUrl = (idx: number) =>
      `https://www.dailyhotel.com/stays?shortCutType=stayAll&regionStayType=new_all&dateCheckIn=${getTodayDate()}&rai=3000000${idx}&rpi=3000000${idx}&stays=1&reg=0`;

    const responseHandler = async (url: string) => {
      const responsePromise = await page.waitForResponse(
        (response) =>
          response.url().startsWith(url) && response.status() === 200
      );
      if (responsePromise.url().startsWith(url)) return responsePromise.json();
    };

    const getHotelList = async () => {
      const hotelRes = await responseHandler(
        "https://www.dailyhotel.com/newdelhi/goodnight/api/v10/stay/plp/list"
      );
      const hotelCount = hotelRes.data.staySalesCount;
      const hotelListSelector =
        hotelRes.data.staySaleSections[
          hotelRes.data.staySaleSections.length - 1
        ].staySales;
      return { hotelCount, hotelListSelector };
    };

    let totalDataList: object[] = [];

    for (let idx = 16; idx < 32; idx += 1) {
      await page.goto(hotelListUrl(idx), { waitUntil: "domcontentloaded" });

      const { hotelCount } = await getHotelList();

      for (let i = 1; i * 50 < hotelCount; i += 1) {
        await page.waitForLoadState("domcontentloaded");
        const requestHandler = (route, request) => {
          if (
            request
              .url()
              .startsWith(
                "https://www.dailyhotel.com/newdelhi/goodnight/api/v10/stay/plp/list"
              )
          ) {
            const requestUrl = new URL(request.url());
            requestUrl.searchParams.set("page", String(i));
            route.continue({ url: requestUrl.toString() });
          } else {
            route.continue();
          }
        };

        await page.route(
          "https://www.dailyhotel.com/newdelhi/goodnight/api/v10/stay/plp/*",
          requestHandler,
          {}
        );
        await page.goto(hotelListUrl(idx), { waitUntil: "domcontentloaded" });

        const { hotelListSelector } = await getHotelList();
        const dataList: SellerInfoProps[] = hotelListSelector.map(
          (hotel: any) => {
            return {
              hotelId: String(hotel.hotelIdx),
              hotelName: hotel.name,
              stayType: hotel.stayTypeName,
              largeLocale: hotel.regionLargeName,
              mediumLocale: hotel.regionMediumName,
            };
          }
        );
        const hotelListPageUrl = page.url();
        console.log(
          `가공한 데이터 갯수: ${dataList.length}\n남은 스프레드시트의 데이터 갯수: ${dataSheetRowCount}`
        );
        if (dataList.length > dataSheetRowCount)
          for (let j = dataSheetRowCount; j < dataList.length - 1; j += 1) {
            // 스프레드시트는 0행이 아닌 1행부터 시작합니다
            await page.waitForTimeout(Math.floor(Math.random() * 250) + 125);
            await page.goto(
              `https://www.dailyhotel.com/owner-attrs/${dataList[j].hotelId}/HOTEL`,
              { waitUntil: "domcontentloaded", timeout: 50000 }
            );
            const sellerInfoRes = await responseHandler(
              `https://www.dailyhotel.com/newdelhi/goodnight/api/v1/common/owner-attrs/${dataList[j].hotelId}/HOTEL`
            );
            const sellerInfoData: any[] = sellerInfoRes.data[0].values;
            const arr = (label: string) => {
              return sellerInfoData[
                sellerInfoData.findIndex((item: any) => {
                  if (item.label === label) return item.value;
                })
              ]?.value;
            };
            const sellerNumber = arr("사업자등록번호");
            const companyName = arr("상호명");
            const sellerName = arr("대표자");
            const sellerPhoneNumber = arr("전화번호");
            const sellerEmail = arr("전자우편번호");
            dataList[j] = {
              ...dataList[j],
              sellerNumber,
              companyName,
              sellerName,
              sellerPhoneNumber,
              sellerEmail,
            };
            await dataSheet.addRow(Object.values(dataList[j]), { raw: true });
          }

        if (dataSheetRowCount > 0) dataSheetRowCount -= dataList.length;
        if (dataSheetRowCount <= 0) dataSheetRowCount = 0;

        totalDataList = totalDataList.concat(dataList);
        await page.goto(hotelListPageUrl);
      }
    }
    await page.waitForTimeout(1000);
    await page.goto("https://www.dailyhotel.com/");
  } catch (e) {
    console.error(e);
    return;
  } finally {
    page.unroute("**/**");
  }
};
