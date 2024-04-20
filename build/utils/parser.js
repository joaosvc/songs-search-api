"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const spotify_album_1 = tslib_1.__importDefault(require("../models/spotify-album"));
const spotify_artist_1 = tslib_1.__importDefault(require("../models/spotify-artist"));
const spotify_playlist_1 = tslib_1.__importDefault(require("../models/spotify-playlist"));
const spotify_song_1 = tslib_1.__importDefault(require("../models/spotify-song"));
const ytmusic_1 = tslib_1.__importDefault(require("../providers/audio/ytmusic"));
const formatter_1 = tslib_1.__importDefault(require("./formatter"));
class Parser {
    static searchSongs(request, offset, limit) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Remove /intl-xxx/ from Spotify URLs with regex
            request = request.replace(/\/intl-\w+\//, "/");
            try {
                if (request.includes("open.spotify.com") && request.includes("track")) {
                    return yield spotify_song_1.default.fromUrl(request);
                }
                else if (request.includes("https://spotify.link/")) {
                    const fullUrl = yield Parser.getFullSpotifyUrl(request);
                    return yield Parser.searchSongs(fullUrl);
                }
                else if (request.includes("open.spotify.com") &&
                    request.includes("playlist")) {
                    return yield spotify_playlist_1.default.fromUrl(request, offset, limit);
                }
                else if (request.includes("open.spotify.com") &&
                    request.includes("album")) {
                    return yield spotify_album_1.default.fromUrl(request, offset, limit);
                }
                else if (request.includes("open.spotify.com") &&
                    request.includes("artist")) {
                    return yield spotify_artist_1.default.fromUrl(request, offset, limit);
                }
                else if (request.includes("youtube.com/watch?v")) {
                    const songResult = yield ytmusic_1.default.getSong(ytmusic_1.default.getWatchId(request));
                    if (songResult != null) {
                        /**
                         * Exemple of Spotify Search Result
                         *
                         * SpotifySong.fromSearchTerm(`${songFull.artist.name} - ${songFull.name}`)
                         */
                        const image = formatter_1.default.getMaxImageUrl(songResult.thumbnails);
                        return spotify_song_1.default.buildSearchResultMetadata({
                            name: songResult.name,
                            url: request,
                            image: image,
                            songId: songResult.videoId,
                            album: songResult.name,
                            artist: songResult.artist.name,
                            artists: [songResult.artist.name],
                            duration: songResult.duration,
                            isrc: null,
                        });
                    }
                }
            }
            catch (error) {
                throw new Error("Error parsing Spotify URL: " + error.message);
            }
            return spotify_song_1.default.buildSearchResultMetadata();
        });
    }
    static searchPlaylistSongs(playlistId, offset, limit) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield spotify_playlist_1.default.fromUrl(playlistId, offset, limit);
            }
            catch (error) {
                throw new Error("Error rettriving next songs of playlist: " + error.message);
            }
        });
    }
    static searchAlbumSongs(albumId, offset, limit) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield spotify_album_1.default.fromUrl(albumId, offset, limit);
            }
            catch (error) {
                throw new Error("Error rettriving next songs of album: " + error.message);
            }
        });
    }
    static searchArtistsAlbums(artistId, offset, limit) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield spotify_artist_1.default.fromUrl(artistId, offset, limit);
            }
            catch (error) {
                throw new Error("Error rettriving next albums of artist: " + error.message);
            }
        });
    }
    static getFullSpotifyUrl(request) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(request, {
                    method: "HEAD",
                    redirect: "follow",
                });
                return response.url;
            }
            catch (error) {
                throw new Error("Error rettriving Spotify full URL: " + error.message);
            }
        });
    }
}
exports.default = Parser;
