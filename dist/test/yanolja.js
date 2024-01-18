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
exports.yanolja = void 0;
const spreadsheet_1 = __importDefault(require("../config/spreadsheet"));
const yanolja = (page) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("yanolja 크롤링 시작");
    const dataSheet = yield (0, spreadsheet_1.default)("야놀자 test", [
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
    if (!dataSheet)
        return console.log("구글 스프레드 시트 못 가져옴");
    const dataSheetRows = yield dataSheet.getRows();
    let dataSheetRowCount = dataSheetRows.length;
    const accommodationList = ["hotel", "pension"];
    const regex = (accommodation) => new RegExp(`\/${accommodation}\/(\\\d+)`);
    let data = [];
    let emailList = [];
    emailList = dataSheetRows.map((row) => {
        return row.get("판매자이메일");
    });
    for (const accommodation of accommodationList) {
        yield page.goto(`https://www.yanolja.com/sub-home/${accommodation}`);
        let choiceLocationBtn = page.getByRole("button", { name: "지역 선택" });
        yield choiceLocationBtn.click();
        yield page.waitForTimeout(1000);
        choiceLocationBtn = page.locator("section section > h2 > i");
        const locations = yield page
            .locator("main > section > div > ul")
            .first()
            .locator("li")
            .all();
        for (const location of locations) {
            yield page.waitForTimeout(1000);
            const locationText = yield location.innerText();
            yield location.click();
            const listOfLocationBtn = page.locator('a[data-depth="main"]').first();
            yield listOfLocationBtn.click();
            const responseHandler = (url) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const responsePromise = yield page.waitForResponse((response) => response.url().startsWith(url) && response.status() === 200, { timeout: 5000 });
                    if (responsePromise.url().startsWith(url))
                        return responsePromise.json();
                }
                catch (_a) {
                    return false;
                }
            });
            while (true) {
                yield page.waitForTimeout(500);
                yield page.mouse.wheel(0, 20000);
                const res = yield responseHandler("https://www.yanolja.com/api/v1/v7/contents/search");
                if (!res)
                    break;
            }
            const accommodationListUrl = page.url();
            yield page.waitForLoadState();
            const links = yield page.$$eval("a", (anchors) => anchors.map((a) => a.getAttribute("href")));
            const motelNumbers = links
                .filter((link) => link && regex(accommodation).test(link)) // /motel/로 시작하는 링크만 필터링
                .map((link) => {
                link.match(regex(accommodation))[1];
            }); // 숫자만 추출하여 새로운 배열 생성
            if (motelNumbers.length > dataSheetRowCount)
                for (let j = dataSheetRowCount; j < motelNumbers.length; j++) {
                    let obj = {};
                    try {
                        yield page.goto(`https://place-site.yanolja.com/places/${motelNumbers[j]}`);
                        yield page.getByRole("link", { name: "위치/교통" }).click();
                        const address = yield page
                            .locator('h4 + div[data-testid="sub-content"] > div:nth-child(2) div', { hasNotText: "주소복사" })
                            .innerText();
                        yield page.waitForSelector('[data-swiper-slide-index="0"]');
                        yield page.waitForSelector('[data-testid="back-button"]');
                        yield page.getByText("판매자 정보").click();
                        const nameElement = yield page.waitForSelector('.tableTypeRow div:has-text("대표자명") + div > div', { timeout: 5000 });
                        const name = yield page.evaluate((element) => { var _a; return (_a = element.textContent) !== null && _a !== void 0 ? _a : ""; }, nameElement);
                        const companyNameElement = yield page.waitForSelector('.tableTypeRow div:has-text("상호명") + div > div', { timeout: 5000 });
                        const companyName = yield page.evaluate((element) => { var _a; return (_a = element.textContent) !== null && _a !== void 0 ? _a : ""; }, companyNameElement);
                        const addressElement = yield page.waitForSelector('.tableTypeRow div:has-text("사업자주소") + div > div', { timeout: 5000 });
                        const emailElement = yield page.waitForSelector('.tableTypeRow div:has-text("전자우편주소") + div > div', { timeout: 5000 });
                        const email = yield page.evaluate((element) => { var _a; return (_a = element.textContent) !== null && _a !== void 0 ? _a : ""; }, emailElement);
                        const phoneElement = yield page.waitForSelector('.tableTypeRow div:has-text("연락처") + div > div', { timeout: 5000 });
                        const phone = yield page.evaluate((element) => { var _a; return (_a = element.textContent) !== null && _a !== void 0 ? _a : ""; }, phoneElement);
                        const registrationNumberElement = yield page.waitForSelector('.tableTypeRow div:has-text("사업자등록번호") + div > div', { timeout: 5000 });
                        const registrationNumber = yield page.evaluate((element) => { var _a; return (_a = element.textContent) !== null && _a !== void 0 ? _a : ""; }, registrationNumberElement);
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
                        console.log(`${locationText}의 크롤링 진행률: ${((j + 1) / motelNumbers.length) * 100}%`);
                        console.log(`${locationText} 잔여 데이터: ${dataSheetRowCount === 0 ? 0 : motelNumbers.length - j - 1}\n`);
                        yield page.goBack();
                    }
                    catch (error) {
                        console.error(`오류 발생!!`, error);
                    }
                    finally {
                        yield page.waitForTimeout(Math.random() * 250 + 250);
                    }
                }
            if (dataSheetRowCount > 0)
                dataSheetRowCount -= motelNumbers.length;
            if (dataSheetRowCount <= 0)
                dataSheetRowCount = 0;
            yield page.goto(accommodationListUrl, { waitUntil: "domcontentloaded" });
            yield choiceLocationBtn.click();
        }
    }
    yield page.close();
});
exports.yanolja = yanolja;
