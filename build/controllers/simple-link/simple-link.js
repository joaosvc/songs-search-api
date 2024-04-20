"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSimpleLinkController = void 0;
const tslib_1 = require("tslib");
const helpers_1 = require("../helpers");
const youtube_search_1 = tslib_1.__importDefault(require("../../models/youtube-search"));
class GetSimpleLinkController {
    handle(httpRequest) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const requiredFields = [
                    "name",
                    "album",
                    "songId",
                    "url",
                    "artist",
                    "artists",
                    "isrc",
                    "duration",
                ];
                for (const field of requiredFields) {
                    if (!((_a = httpRequest === null || httpRequest === void 0 ? void 0 : httpRequest.body) === null || _a === void 0 ? void 0 : _a[field])) {
                        return (0, helpers_1.badRequest)(`Field ${field} is required`);
                    }
                }
                const metadata = yield youtube_search_1.default.fromParams(httpRequest.body);
                return (0, helpers_1.ok)(metadata);
            }
            catch (error) {
                if (error instanceof Error) {
                    return (0, helpers_1.badRequest)(error.message);
                }
                else {
                    console.error(error);
                    return (0, helpers_1.serverError)();
                }
            }
        });
    }
}
exports.GetSimpleLinkController = GetSimpleLinkController;
