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
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = require("playwright");
const runTest = () => __awaiter(void 0, void 0, void 0, function* () {
    // 브라우저 열기
    const browser = yield playwright_1.chromium.launch();
    // 새 컨텍스트 열기
    const context = yield browser.newContext();
    // 새 페이지 열기
    const page = yield context.newPage();
    try {
        // React 애플리케이션의 URL로 이동
        yield page.goto("http://localhost:3000");
        // 버튼을 찾아서 클릭
        yield page.click("button#myButton");
        // 스크린샷 찍기
        yield page.screenshot({ path: "screenshot.png" });
        console.log("테스트 성공: 스크린샷 찍음");
    }
    catch (error) {
        console.error("테스트 실패:", error);
    }
    finally {
        // 브라우저 닫기
        yield browser.close();
    }
});
runTest();
