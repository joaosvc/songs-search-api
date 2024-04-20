"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const types_1 = require("../@types/types");
const checkType_1 = tslib_1.__importDefault(require("../utils/checkType"));
const traverse_1 = require("../utils/traverse");
const AlbumParser_1 = tslib_1.__importDefault(require("./AlbumParser"));
const PlaylistParser_1 = tslib_1.__importDefault(require("./PlaylistParser"));
const SongParser_1 = tslib_1.__importDefault(require("./SongParser"));
const VideoParser_1 = tslib_1.__importDefault(require("./VideoParser"));
class ArtistParser {
    static parse(data, artistId) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        const artistBasic = {
            artistId,
            name: (0, traverse_1.traverseString)(data, "header", "title", "text"),
        };
        return (0, checkType_1.default)(Object.assign(Object.assign({ type: "ARTIST" }, artistBasic), { thumbnails: (0, traverse_1.traverseList)(data, "header", "thumbnails"), topSongs: (0, traverse_1.traverseList)(data, "musicShelfRenderer", "contents").map(item => SongParser_1.default.parseArtistTopSong(item, artistBasic)), topAlbums: (_c = (_b = (_a = (0, traverse_1.traverseList)(data, "musicCarouselShelfRenderer")) === null || _a === void 0 ? void 0 : _a.at(0)) === null || _b === void 0 ? void 0 : _b.contents.map((item) => AlbumParser_1.default.parseArtistTopAlbum(item, artistBasic))) !== null && _c !== void 0 ? _c : [], topSingles: (_f = (_e = (_d = (0, traverse_1.traverseList)(data, "musicCarouselShelfRenderer")) === null || _d === void 0 ? void 0 : _d.at(1)) === null || _e === void 0 ? void 0 : _e.contents.map((item) => AlbumParser_1.default.parseArtistTopAlbum(item, artistBasic))) !== null && _f !== void 0 ? _f : [], topVideos: (_j = (_h = (_g = (0, traverse_1.traverseList)(data, "musicCarouselShelfRenderer")) === null || _g === void 0 ? void 0 : _g.at(2)) === null || _h === void 0 ? void 0 : _h.contents.map((item) => VideoParser_1.default.parseArtistTopVideo(item, artistBasic))) !== null && _j !== void 0 ? _j : [], featuredOn: (_m = (_l = (_k = (0, traverse_1.traverseList)(data, "musicCarouselShelfRenderer")) === null || _k === void 0 ? void 0 : _k.at(3)) === null || _l === void 0 ? void 0 : _l.contents.map((item) => PlaylistParser_1.default.parseArtistFeaturedOn(item, artistBasic))) !== null && _m !== void 0 ? _m : [], similarArtists: (_q = (_p = (_o = (0, traverse_1.traverseList)(data, "musicCarouselShelfRenderer")) === null || _o === void 0 ? void 0 : _o.at(4)) === null || _p === void 0 ? void 0 : _p.contents.map((item) => this.parseSimilarArtists(item))) !== null && _q !== void 0 ? _q : [] }), types_1.ArtistFull);
    }
    static parseSearchResult(item) {
        const columns = (0, traverse_1.traverseList)(item, "flexColumns", "runs").flat();
        // No specific way to identify the title
        const title = columns[0];
        return (0, checkType_1.default)({
            type: "ARTIST",
            artistId: (0, traverse_1.traverseString)(item, "browseId"),
            name: (0, traverse_1.traverseString)(title, "text"),
            thumbnails: (0, traverse_1.traverseList)(item, "thumbnails"),
        }, types_1.ArtistDetailed);
    }
    static parseSimilarArtists(item) {
        return (0, checkType_1.default)({
            type: "ARTIST",
            artistId: (0, traverse_1.traverseString)(item, "browseId"),
            name: (0, traverse_1.traverseString)(item, "runs", "text"),
            thumbnails: (0, traverse_1.traverseList)(item, "thumbnails"),
        }, types_1.ArtistDetailed);
    }
}
exports.default = ArtistParser;
