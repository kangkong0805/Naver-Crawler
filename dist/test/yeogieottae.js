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
exports.yeogieottae = void 0;
const spreadsheet_1 = __importDefault(require("../config/spreadsheet"));
const yeogieottae = (page) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("yeogieottae 크롤링 시작");
    const doc = yield (0, spreadsheet_1.default)("여기어때", [
        "업장ID",
        "업장명",
        "숙박타입",
        "주소",
        "사업자등록번호",
        "판매자이름",
        "판매자전화번호",
        "판매자이메일",
    ]);
    if (!doc)
        return;
    const dataSheetRows = yield doc.getRows();
    let dataSheetRowCount = dataSheetRows.length;
    const data = [];
    let emailList = [];
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
        yield page.goto(linkHouse[k]);
        const links = yield page.$$eval(".city_child li a", (anchors) => anchors.map((a) => a.href));
        for (let i = 1; i < links.length; i++) {
            yield page.goto(links[i]);
            const items = yield page.$$eval(`li.${typeHouse[k]} a`, (anchors) => anchors.map((a) => a.getAttribute("href")));
            console.log(links.length, dataSheetRowCount);
            if (items.length > dataSheetRowCount)
                for (let j = 0; j < items.length; j++) {
                    const link = items[j];
                    if (!link)
                        continue;
                    yield page.goto(link, { waitUntil: "domcontentloaded" });
                    const currentUrl = new URL(page.url());
                    const accommodationId = (_a = currentUrl.searchParams.get("ano")) !== null && _a !== void 0 ? _a : "";
                    const buttonSelector = "div.btn_center button";
                    const button = yield page.$(buttonSelector);
                    if (button) {
                        yield button.click();
                    }
                    else {
                        // console.log("해당 element가 발견되지 않았습니다. 클릭하지 않습니다.");
                    }
                    yield page.click("text='숙소정보'");
                    yield page.click("text='판매자 정보'");
                    const sellerInfoSection = yield page.$("section.seller_info");
                    const getSellerInfo = (name) => __awaiter(void 0, void 0, void 0, function* () {
                        var _b;
                        const sellerNameElement = yield (sellerInfoSection === null || sellerInfoSection === void 0 ? void 0 : sellerInfoSection.$(`h3:has-text("${name}") + ul li`));
                        let sellerInfo;
                        if (sellerNameElement) {
                            sellerInfo =
                                (_b = (yield page.evaluate((element) => element.textContent, sellerNameElement))) !== null && _b !== void 0 ? _b : "";
                        }
                        else {
                            // console.log("대표자명 요소를 찾을 수 없습니다.");
                            sellerInfo = "";
                        }
                        return sellerInfo;
                    });
                    const businessName = yield getSellerInfo("상호");
                    const sellerName = yield getSellerInfo("대표자명");
                    const address = yield getSellerInfo("주소");
                    const email = yield getSellerInfo("이메일");
                    const phone = yield getSellerInfo("전화번호");
                    const sellerNumber = yield getSellerInfo("사업자번호");
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
                    yield page.goBack({ waitUntil: "domcontentloaded" });
                }
            if (dataSheetRowCount > 0)
                dataSheetRowCount -= links.length;
            if (dataSheetRowCount <= 0)
                dataSheetRowCount = 0;
        }
    }
    yield page.close();
});
exports.yeogieottae = yeogieottae;
