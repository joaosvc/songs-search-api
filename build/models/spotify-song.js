"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotifySongError = void 0;
const tslib_1 = require("tslib");
const spotify_1 = tslib_1.__importDefault(require("../providers/audio/spotify"));
const formatter_1 = tslib_1.__importDefault(require("../utils/formatter"));
class SpotifySongError extends Error {
    constructor(message) {
        super(message);
        this.name = "SpotifySongError";
    }
}
exports.SpotifySongError = SpotifySongError;
class SpotifySong {
    static fromUrl(url) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!url.includes("open.spotify.com") || !url.includes("track")) {
                throw new SpotifySongError(`Invalid URL: ${url}`);
            }
            const rawTrackMeta = yield spotify_1.default.getTrack(url);
            if (!rawTrackMeta ||
                rawTrackMeta.duration_ms === 0 ||
                rawTrackMeta.name.trim() === "") {
                throw new SpotifySongError(`Track no longer exists: ${url}`);
            }
            return this.buildSearchResultMetadata(SpotifySong.songFromTrackMeta(rawTrackMeta));
        });
    }
    static fromSearchTerm(searchTerm) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _a;
            const rawSearchResults = yield spotify_1.default.search(searchTerm);
            if (rawSearchResults.tracks === undefined) {
                throw new SpotifySongError(`No tracks results found for: ${searchTerm}`);
            }
            if (((_a = rawSearchResults.tracks) === null || _a === void 0 ? void 0 : _a.items.length) === 0) {
                throw new SpotifySongError(`No results found for: ${searchTerm}`);
            }
            const rawTrackMeta = rawSearchResults.tracks.items[0];
            return this.buildSearchResultMetadata(SpotifySong.songFromTrackMeta(rawTrackMeta));
        });
    }
    static buildSearchResultMetadata(song) {
        return {
            songs: song ? [song] : [],
            hasMore: false,
            nextId: null,
            nextOffset: null,
            offset: 0,
            limit: 1,
        };
    }
    static songFromTrackMeta(rawTrackMeta, args = {}) {
        const image = formatter_1.default.getMaxImageUrl(rawTrackMeta.album.images);
        return Object.assign({ name: rawTrackMeta.name, image: image, url: rawTrackMeta.external_urls.spotify, songId: rawTrackMeta.id, album: rawTrackMeta.album.name, artist: rawTrackMeta.artists[0].name, artists: rawTrackMeta.artists.map((artist) => artist.name), isrc: rawTrackMeta.external_ids ? rawTrackMeta.external_ids.isrc : null, duration: Math.floor(rawTrackMeta.duration_ms / 1000) }, args);
    }
    static songFromSimplifiedTrackMeta(rawTrackMeta, args = {}) {
        return Object.assign({ name: rawTrackMeta.name, url: rawTrackMeta.external_urls.spotify, songId: rawTrackMeta.id, album: rawTrackMeta.name, artist: rawTrackMeta.artists[0].name, artists: rawTrackMeta.artists.map((artist) => artist.name), duration: Math.floor(rawTrackMeta.duration_ms / 1000), isrc: null, image: "" }, args);
    }
}
exports.default = SpotifySong;
