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
const index_1 = require("../test/index");
const crawling = () => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield playwright_1.chromium.launch({ headless: true });
    const context = yield browser.newContext();
    const otaCrawler = (func) => __awaiter(void 0, void 0, void 0, function* () {
        const page = yield context.newPage();
        page.setDefaultTimeout(99999999);
        page.setDefaultNavigationTimeout(99999999);
        func(page);
    });
    otaCrawler(index_1.dailyHotel);
    otaCrawler(index_1.yanolja);
    otaCrawler(index_1.yeogieottae);
    otaCrawler(index_1.ddnayo);
});
exports.default = crawling;
