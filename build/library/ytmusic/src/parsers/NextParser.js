"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const types_1 = require("../@types/types");
const checkType_1 = tslib_1.__importDefault(require("../utils/checkType"));
const traverse_1 = require("../utils/traverse");
class NextParser {
    static parse(data) {
        const playlistData = (0, traverse_1.traverseString)(data, "playlistPanelVideoRenderer");
        return (0, checkType_1.default)({
            index: +(0, traverse_1.traverseString)(playlistData, "navigationEndpoint", "index"),
            name: (0, traverse_1.traverseString)(playlistData, "title", "text"),
            artist: (0, traverse_1.traverseString)(playlistData, "longBylineText", "text"),
            playlistId: (0, traverse_1.traverseString)(playlistData, "navigationEndpoint", "playlistId"),
            videoId: (0, traverse_1.traverseString)(playlistData, "videoId"),
            selected: (0, traverse_1.traverseString)(playlistData, "selected") === "true",
            params: (0, traverse_1.traverseString)(playlistData, "navigationEndpoint", "params"),
            thumbnails: (0, traverse_1.traverseList)(playlistData, "thumbnails")
        }, types_1.NextResult);
    }
}
exports.default = NextParser;
