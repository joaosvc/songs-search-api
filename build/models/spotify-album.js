"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotifyAlbumError = void 0;
const tslib_1 = require("tslib");
const spotify_1 = tslib_1.__importDefault(require("../providers/audio/spotify"));
const spotify_song_1 = tslib_1.__importDefault(require("./spotify-song"));
const formatter_1 = tslib_1.__importDefault(require("../utils/formatter"));
class SpotifyAlbumError extends Error {
    constructor(message) {
        super(message);
        this.name = "SpotifyAlbumError";
    }
}
exports.SpotifyAlbumError = SpotifyAlbumError;
class SpotifyAlbum {
    static fromUrl(url, offset, limit) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const rawRequestLimit = (limit ? Math.min(limit, 50) : limit);
            const [rawAlbumMeta, rawAlbumTracks] = yield Promise.all([
                spotify_1.default.getAlbum(url),
                spotify_1.default.instance.albums.tracks(spotify_1.default.getIdFromUrl(url), undefined, rawRequestLimit, offset),
            ]);
            const songs = [];
            for (const rawSimpliedTrackMeta of rawAlbumTracks.items) {
                if (!rawSimpliedTrackMeta || rawSimpliedTrackMeta.is_local) {
                    continue;
                }
                songs.push(spotify_song_1.default.songFromSimplifiedTrackMeta(rawSimpliedTrackMeta, {
                    album: rawAlbumMeta.name,
                    image: formatter_1.default.getMaxImageUrl(rawAlbumMeta.images),
                }));
            }
            // await Promise.all(
            //   rawAlbumTracks.items
            //     .filter((rawTrackMeta) => rawTrackMeta && !rawTrackMeta.is_local)
            //     .map(async (rawTrackMeta) => {
            //       const newRawTrackMeta = await Spotify.getTrack(rawTrackMeta.id);
            //       songs.push(
            //         SpotifySong.songFromTrackMeta(newRawTrackMeta, {
            //           album: rawAlbumMeta.name,
            //         })
            //       );
            //     })
            // );
            const rawNextAlbumId = spotify_1.default.getIdFromUrl(rawAlbumTracks.next);
            const rawNextAlbumOffset = rawAlbumTracks.next
                ? rawAlbumTracks.offset + rawAlbumTracks.limit
                : null;
            return {
                songs: songs,
                hasMore: !!rawAlbumTracks.next,
                nextId: rawNextAlbumId,
                nextOffset: rawNextAlbumOffset,
                offset: rawAlbumTracks.offset,
                limit: rawAlbumTracks.limit,
            };
        });
    }
}
exports.default = SpotifyAlbum;
