"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const arktype_1 = require("arktype");
const assert_1 = require("assert");
const bun_test_1 = require("bun:test");
const types_1 = require("../@types/types");
const constants_1 = require("../constants");
const YTMusic_1 = tslib_1.__importDefault(require("../YTMusic"));
const errors = [];
const configs = [
    { GL: "RU", HL: "ru" },
    { GL: "US", HL: "en" },
    { GL: "DE", HL: "de" },
];
const expect = (data, type) => {
    var _a;
    const result = type(data);
    if ((_a = result.problems) === null || _a === void 0 ? void 0 : _a.length) {
        errors.push(...result.problems);
    }
    else {
        const empty = JSON.stringify(result.data).match(/"\w+":""/g);
        if (empty) {
            console.log(result.data, empty);
        }
        (0, assert_1.equal)(empty, null);
    }
    (0, assert_1.equal)(result.problems, undefined);
};
const ytmusic = new YTMusic_1.default();
(0, bun_test_1.beforeEach)(() => {
    const index = 0;
    return ytmusic.initialize(configs[index]);
});
(0, bun_test_1.describe)(`Query: ${constants_1.FE_MUSIC_HOME}`, () => {
    configs.forEach(config => {
        (0, bun_test_1.it)(`Get ${config.GL} ${config.HL}`, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const homePageContents = yield ytmusic.getHome();
            (0, assert_1.ok)(homePageContents.length);
            expect(homePageContents, (0, arktype_1.arrayOf)(types_1.HomePageContent));
            console.log("Length: ", homePageContents.length);
        }));
    });
});
(0, bun_test_1.afterAll)(() => console.log("Issues:", errors));
