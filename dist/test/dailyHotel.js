"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyHotel = void 0;
const spreadsheet_1 = __importDefault(require("../config/spreadsheet"));
const dailyHotel = (page) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("dailyhotel 크롤링 시작");
    const getTodayDate = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}-${month}-${day}`;
    };
    try {
        const dataSheet = yield (0, spreadsheet_1.default)("데일리호텔 test", [
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
        if (!dataSheet)
            return;
        const dataSheetRows = yield dataSheet.getRows();
        let dataSheetRowCount = dataSheetRows.length - 1; // 데이터들의 label이 있는 행은 제외합니다
        yield page.goto("https://www.dailyhotel.com/", {
            waitUntil: "domcontentloaded",
        });
        yield page.waitForTimeout(500);
        const hotelListUrl = (idx) => `https://www.dailyhotel.com/stays?shortCutType=stayAll&regionStayType=new_all&dateCheckIn=${getTodayDate()}&rai=3000000${idx}&rpi=3000000${idx}&stays=1&reg=0`;
        const responseHandler = (url) => __awaiter(void 0, void 0, void 0, function* () {
            const responsePromise = yield page.waitForResponse((response) => response.url().startsWith(url) && response.status() === 200);
            if (responsePromise.url().startsWith(url))
                return responsePromise.json();
        });
        const getHotelList = () => __awaiter(void 0, void 0, void 0, function* () {
            const hotelRes = yield responseHandler("https://www.dailyhotel.com/newdelhi/goodnight/api/v10/stay/plp/list");
            const hotelCount = hotelRes.data.staySalesCount;
            const hotelListSelector = hotelRes.data.staySaleSections[hotelRes.data.staySaleSections.length - 1].staySales;
            return { hotelCount, hotelListSelector };
        });
        let totalDataList = [];
        for (let idx = 16; idx < 32; idx += 1) {
            yield page.goto(hotelListUrl(idx), { waitUntil: "domcontentloaded" });
            const { hotelCount } = yield getHotelList();
            for (let i = 1; i * 50 < hotelCount; i += 1) {
                yield page.waitForLoadState("domcontentloaded");
                const requestHandler = (route, request) => {
                    if (request
                        .url()
                        .startsWith("https://www.dailyhotel.com/newdelhi/goodnight/api/v10/stay/plp/list")) {
                        const requestUrl = new URL(request.url());
                        requestUrl.searchParams.set("page", String(i));
                        route.continue({ url: requestUrl.toString() });
                    }
                    else {
                        route.continue();
                    }
                };
                yield page.route("https://www.dailyhotel.com/newdelhi/goodnight/api/v10/stay/plp/*", requestHandler, {});
                yield page.goto(hotelListUrl(idx), { waitUntil: "domcontentloaded" });
                const { hotelListSelector } = yield getHotelList();
                const dataList = hotelListSelector.map((hotel) => {
                    return {
                        hotelId: String(hotel.hotelIdx),
                        hotelName: hotel.name,
                        stayType: hotel.stayTypeName,
                        largeLocale: hotel.regionLargeName,
                        mediumLocale: hotel.regionMediumName,
                    };
                });
                const hotelListPageUrl = page.url();
                console.log(`가공한 데이터 갯수: ${dataList.length}\n남은 스프레드시트의 데이터 갯수: ${dataSheetRowCount}`);
                if (dataList.length > dataSheetRowCount)
                    for (let j = dataSheetRowCount; j < dataList.length - 1; j += 1) {
                        // 스프레드시트는 0행이 아닌 1행부터 시작합니다
                        yield page.waitForTimeout(Math.floor(Math.random() * 250) + 125);
                        yield page.goto(`https://www.dailyhotel.com/owner-attrs/${dataList[j].hotelId}/HOTEL`, { waitUntil: "domcontentloaded", timeout: 50000 });
                        const sellerInfoRes = yield responseHandler(`https://www.dailyhotel.com/newdelhi/goodnight/api/v1/common/owner-attrs/${dataList[j].hotelId}/HOTEL`);
                        const sellerInfoData = sellerInfoRes.data[0].values;
                        const arr = (label) => {
                            var _a;
                            return (_a = sellerInfoData[sellerInfoData.findIndex((item) => {
                                if (item.label === label)
                                    return item.value;
                            })]) === null || _a === void 0 ? void 0 : _a.value;
                        };
                        const sellerNumber = arr("사업자등록번호");
                        const companyName = arr("상호명");
                        const sellerName = arr("대표자");
                        const sellerPhoneNumber = arr("전화번호");
                        const sellerEmail = arr("전자우편번호");
                        dataList[j] = Object.assign(Object.assign({}, dataList[j]), { sellerNumber,
                            companyName,
                            sellerName,
                            sellerPhoneNumber,
                            sellerEmail });
                        yield dataSheet.addRow(Object.values(dataList[j]), { raw: true });
                    }
                if (dataSheetRowCount > 0)
                    dataSheetRowCount -= dataList.length;
                if (dataSheetRowCount <= 0)
                    dataSheetRowCount = 0;
                totalDataList = totalDataList.concat(dataList);
                yield page.goto(hotelListPageUrl);
            }
        }
        yield page.waitForTimeout(1000);
        yield page.goto("https://www.dailyhotel.com/");
    }
    catch (e) {
        console.error(e);
        return;
    }
    finally {
        page.unroute("**/**");
        yield page.close();
    }
});
exports.dailyHotel = dailyHotel;
