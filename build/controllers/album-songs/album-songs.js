"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAlbumSongsController = void 0;
const tslib_1 = require("tslib");
const helpers_1 = require("../helpers");
const parser_1 = tslib_1.__importDefault(require("../../utils/parser"));
class GetAlbumSongsController {
    handle(httpRequest) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const requiredFields = [
                    "albumId",
                    "offset",
                    "limit",
                ];
                for (const field of requiredFields) {
                    if (!((_a = httpRequest === null || httpRequest === void 0 ? void 0 : httpRequest.body) === null || _a === void 0 ? void 0 : _a[field])) {
                        return (0, helpers_1.badRequest)(`Field ${field} is required`);
                    }
                }
                const { albumId, offset, limit } = httpRequest.body;
                const metadata = yield parser_1.default.searchAlbumSongs(albumId, offset, limit);
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
exports.GetAlbumSongsController = GetAlbumSongsController;
