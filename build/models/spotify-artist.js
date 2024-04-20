"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotifyArtistError = void 0;
const tslib_1 = require("tslib");
const spotify_1 = tslib_1.__importDefault(require("../providers/audio/spotify"));
class SpotifyArtistError extends Error {
    constructor(message) {
        super(message);
        this.name = "SpotifyArtistError";
    }
}
exports.SpotifyArtistError = SpotifyArtistError;
class SpotifyArtist {
    static fromUrl(url, offset, limit) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const rawArtistMeta = yield spotify_1.default.getArtist(url);
            const rawRequestLimit = (limit ? Math.min(limit, 50) : limit);
            const rawArtistAlbums = yield spotify_1.default.instance.artists.albums(rawArtistMeta.id, "album,single", undefined, rawRequestLimit, offset);
            const albums = [];
            for (const album of rawArtistAlbums.items) {
                albums.push(album.external_urls.spotify);
            }
            const rawNextArtistId = spotify_1.default.getIdFromUrl(rawArtistAlbums.next);
            const rawNextAlbumOffset = rawArtistAlbums.next
                ? rawArtistAlbums.offset + rawArtistAlbums.limit
                : null;
            return {
                albums: albums,
                hasMore: !!rawArtistAlbums.next,
                nextId: rawNextArtistId,
                nextOffset: rawNextAlbumOffset,
                offset: rawArtistAlbums.offset,
                limit: rawArtistAlbums.limit,
            };
        });
    }
}
exports.default = SpotifyArtist;
