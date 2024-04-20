"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotifyError = void 0;
const tslib_1 = require("tslib");
const web_api_ts_sdk_1 = require("@spotify/web-api-ts-sdk");
class SpotifyError extends Error {
    constructor(message) {
        super(message);
        this.name = "SpotifyError";
    }
}
exports.SpotifyError = SpotifyError;
class Spotify {
    static initialize(clientId, clientSecret) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!(this.instance instanceof web_api_ts_sdk_1.SpotifyApi)) {
                try {
                    this.instance = web_api_ts_sdk_1.SpotifyApi.withClientCredentials(clientId, clientSecret, ["user-library-read", "user-follow-read", "playlist-read-private"]);
                }
                catch (error) {
                    console.error("Error initializing Spotify", error);
                }
            }
        });
    }
    static validateConnection() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!(this.instance instanceof web_api_ts_sdk_1.SpotifyApi)) {
                    throw new SpotifyError("Spotify client not initialized");
                }
                const results = yield this.instance.search("a", ["track"], undefined, 1);
                return ((_a = results.tracks) === null || _a === void 0 ? void 0 : _a.total) > 0;
            }
            catch (error) {
                console.error("Error validating connection to YouTubeMusic", error);
                return false;
            }
        });
    }
    static search(searchTerm_1) {
        return tslib_1.__awaiter(this, arguments, void 0, function* (searchTerm, type = ["track"], limit) {
            try {
                return yield this.instance.search(searchTerm, type, undefined, limit);
            }
            catch (error) {
                throw new SpotifyError("Couldn't get search results, check your search term");
            }
        });
    }
    static getAlbum(url) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield Spotify.instance.albums.get(this.getIdFromUrl(url));
            }
            catch (error) {
                throw new SpotifyError("Couldn't get metadata, check if you have passed correct album id");
            }
        });
    }
    static getTrack(url) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield Spotify.instance.tracks.get(this.getIdFromUrl(url));
            }
            catch (error) {
                throw new SpotifyError("Couldn't get metadata, check if you have passed correct track id");
            }
        });
    }
    static getArtist(url) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield Spotify.instance.artists.get(this.getIdFromUrl(url));
            }
            catch (error) {
                throw new SpotifyError("Couldn't get metadata, check if you have passed correct artist id");
            }
        });
    }
    static getPlaylist(url) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield Spotify.instance.playlists.getPlaylist(this.getIdFromUrl(url));
            }
            catch (error) {
                throw new SpotifyError("Couldn't get metadata, check if you have passed correct playlist id");
            }
        });
    }
    static getIdFromUrl(url) {
        if (!(url === null || url === void 0 ? void 0 : url.includes("spotify.com"))) {
            return url;
        }
        const regex = /(?:spotify\.com\/(?:artist|album|playlist|track)\/|playlists\/|albums\/|artists\/)(\w+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
}
Spotify.instance = {};
exports.default = Spotify;
