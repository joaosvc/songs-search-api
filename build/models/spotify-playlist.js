"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotifyPlaylistError = void 0;
const tslib_1 = require("tslib");
const spotify_1 = tslib_1.__importDefault(require("../providers/audio/spotify"));
const spotify_song_1 = tslib_1.__importDefault(require("./spotify-song"));
class SpotifyPlaylistError extends Error {
    constructor(message) {
        super(message);
        this.name = "SpotifyPlaylistError";
    }
}
exports.SpotifyPlaylistError = SpotifyPlaylistError;
class SpotifyPlaylist {
    static fromUrl(url, offset, limit) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const rawRequestLimit = (limit ? Math.min(limit, 50) : limit);
            const rawPlaylistItems = yield spotify_1.default.instance.playlists.getPlaylistItems(spotify_1.default.getIdFromUrl(url), undefined, undefined, rawRequestLimit, offset);
            const songs = [];
            for (const track of rawPlaylistItems.items) {
                if (!track ||
                    !track.track ||
                    track.track.is_local ||
                    track.track.type !== "track") {
                    continue;
                }
                songs.push(spotify_song_1.default.songFromTrackMeta(track.track));
            }
            const rawNextPlaylistId = spotify_1.default.getIdFromUrl(rawPlaylistItems.next);
            const rawNextPlaylistOffset = rawPlaylistItems.next
                ? rawPlaylistItems.offset + rawPlaylistItems.limit
                : null;
            return {
                songs: songs,
                hasMore: !!rawPlaylistItems.next,
                nextId: rawNextPlaylistId,
                nextOffset: rawNextPlaylistOffset,
                offset: rawPlaylistItems.offset,
                limit: rawPlaylistItems.limit,
            };
        });
    }
}
exports.default = SpotifyPlaylist;
