"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeMusicError = void 0;
const tslib_1 = require("tslib");
const src_1 = tslib_1.__importDefault(require("../../library/ytmusic/src/"));
class YoutubeMusicError extends Error {
    constructor(message) {
        super(message);
        this.name = "YoutubeMusicError";
    }
}
exports.YoutubeMusicError = YoutubeMusicError;
class YoutubeMusic {
    static initialize() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!(this.instance instanceof src_1.default)) {
                try {
                    this.instance = new src_1.default();
                    yield this.instance.initialize();
                }
                catch (error) {
                    console.error("Error initializing YoutubeMusic", error);
                }
            }
        });
    }
    static validateConnection() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initialize();
                const results = yield this.instance.searchSongs("a");
                return results.length > 0;
            }
            catch (error) {
                console.error("Error validating connection to YouTubeMusic", error);
                return false;
            }
        });
    }
    static search(searchTerm) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initialize();
                const searchResults = (yield this.instance.search(searchTerm)).filter((result) => result.type === "SONG" || result.type === "VIDEO");
                return searchResults;
            }
            catch (error) {
                console.error("Error searching in YouTubeMusic", error);
                return [];
            }
        });
    }
    static searchSongs(searchTerm) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initialize();
                const searchResults = yield this.instance.searchSongs(searchTerm);
                return searchResults;
            }
            catch (error) {
                console.error("Error searching songs in YouTubeMusic", error);
                return [];
            }
        });
    }
    static searchVideos(searchTerm) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initialize();
                const searchResults = yield this.instance.searchVideos(searchTerm);
                return searchResults;
            }
            catch (error) {
                console.error("Error searching videos in YouTubeMusic", error);
                return [];
            }
        });
    }
    static getSong(videoId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initialize();
                const song = yield this.instance.getSong(videoId);
                return song;
            }
            catch (error) {
                console.error("Error rettriving song from YouTubeMusic", error);
                return null;
            }
        });
    }
    static getVideo(videoId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initialize();
                const video = yield this.instance.getVideo(videoId);
                return video;
            }
            catch (error) {
                console.error("Error rettriving video from YouTubeMusic", error);
                return null;
            }
        });
    }
    static getWatchId(url) {
        var _a, _b;
        return (_b = (_a = url.match(/[?&]v=([^&]+)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : null;
    }
}
YoutubeMusic.instance = {};
exports.default = YoutubeMusic;
