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
exports.ddnayo = void 0;
const retry_1 = require("../config/retry");
const spreadsheet_1 = __importDefault(require("../config/spreadsheet"));
const ddnayo = (page) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("ddnayo 크롤링 시작");
    const data = [];
    yield page.goto("https://trip.ddnayo.com/regional?area=0000&theme=&pageNumber=1&orderBy=recommend");
    const dataSheet = yield (0, spreadsheet_1.default)("떠나요 test", [
        "업장ID",
        "업장명",
        "숙박타입",
        "행정구역",
        "위치",
        "판매자전화번호",
        "판매자이름",
    ]);
    if (!dataSheet)
        return console.log("구글 스프레드 시트 못 가져옴");
    let dataSheetRowCount = (yield dataSheet.getRows()).length - 1;
    const screenShotPath = '/VenditLogs/';
    yield page.screenshot({
        path: `${screenShotPath} playwright_screenshot.png`,
    });
    const numberElement = yield page.$("span.jss120");
    const numberText = yield page.evaluate((numberElement) => numberElement === null || numberElement === void 0 ? void 0 : numberElement.textContent, numberElement);
    if (!numberText)
        return;
    const number = parseInt(numberText.replace(/,/g, ""), 10);
    const pageNumber = number / 24 + 1;
    const responseHandler = (url) => __awaiter(void 0, void 0, void 0, function* () {
        const responsePromise = yield page.waitForResponse((response) => response.url().startsWith(url) && response.status() === 200);
        if (responsePromise.url().startsWith(url))
            return responsePromise.json();
    });
    for (let i = 1; i <= pageNumber; i++) {
        yield page.waitForTimeout(1000);
        let pensionList, contents;
        yield (0, retry_1.retry)(() => __awaiter(void 0, void 0, void 0, function* () {
            yield page.goto(`https://trip.ddnayo.com/regional?area=0000&theme=&pageNumber=${i}&orderBy=recommend`, { waitUntil: 'networkidle' });
            pensionList = yield responseHandler("https://trip.ddnayo.com/web-api/regional");
            contents = pensionList.data.contents;
        }));
        if (!contents)
            return;
        yield page.waitForTimeout(1000);
        const links = yield page.$$eval("li.jss79 a div.jss83 div.jss85", (anchors) => anchors.map((a) => a.textContent));
        if (links.length > dataSheetRowCount)
            for (let i = dataSheetRowCount; i < links.length; i++) {
                const { accommodationId } = contents[i];
                const linkText = (_a = links[i]) !== null && _a !== void 0 ? _a : "";
                yield page.click(`text=${linkText}`);
                const { data: pensionInfo } = yield responseHandler(`https://booking.ddnayo.com/booking-calendar-api/accommodation/${accommodationId}`);
                yield page.waitForTimeout(1000);
                let address, phone;
                try {
                    const addressElement = yield page.$('dt:has-text("주소") + dd');
                    address = yield page.evaluate((element) => element === null || element === void 0 ? void 0 : element.textContent, addressElement);
                }
                catch (error) {
                    console.error("주소를 가져오는 중 에러 발생:", error);
                    continue;
                }
                try {
                    const phoneElement = yield page.$('dt:has-text("연락처") + dd');
                    phone = yield page.evaluate((element) => element === null || element === void 0 ? void 0 : element.textContent, phoneElement);
                }
                catch (error) {
                    console.error("연락처를 가져오는 중 에러 발생:", error);
                    continue;
                }
                const cleanedAddress = address === null || address === void 0 ? void 0 : address.replace("지도 보기", "").trim();
                const obj = {
                    id: accommodationId,
                    name: linkText,
                    stayType: "펜션",
                    largeLocation: pensionInfo.addr1,
                    address: cleanedAddress,
                    phone: phone,
                    sellerName: pensionInfo.repName,
                };
                dataSheet.addRow(Object.values(obj), { raw: true });
                data.push(obj);
                yield page.goBack();
            }
        if (dataSheetRowCount > 0)
            dataSheetRowCount -= links.length;
        if (dataSheetRowCount <= 0)
            dataSheetRowCount = 0;
    }
    yield page.close();
});
exports.ddnayo = ddnayo;
