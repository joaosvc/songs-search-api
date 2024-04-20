"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const types_1 = require("../@types/types");
const checkType_1 = tslib_1.__importDefault(require("../utils/checkType"));
const filters_1 = require("../utils/filters");
const traverse_1 = require("../utils/traverse");
const Parser_1 = tslib_1.__importDefault(require("./Parser"));
class SongParser {
    static parse(data) {
        return (0, checkType_1.default)({
            type: "SONG",
            videoId: (0, traverse_1.traverseString)(data, "videoDetails", "videoId"),
            name: (0, traverse_1.traverseString)(data, "videoDetails", "title"),
            /**
             * What could this Parse be? How do we get into it?
             * Then we define the main artist in the list
             */
            artists: [
                {
                    name: (0, traverse_1.traverseString)(data, "author"),
                    artistId: (0, traverse_1.traverseString)(data, "videoDetails", "channelId"),
                },
            ],
            artist: {
                name: (0, traverse_1.traverseString)(data, "author"),
                artistId: (0, traverse_1.traverseString)(data, "videoDetails", "channelId"),
            },
            views: +(0, traverse_1.traverseString)(data, "videoDetails", "viewCount"),
            duration: +(0, traverse_1.traverseString)(data, "videoDetails", "lengthSeconds"),
            thumbnails: (0, traverse_1.traverseList)(data, "videoDetails", "thumbnails"),
            formats: (0, traverse_1.traverseList)(data, "streamingData", "formats"),
            adaptiveFormats: (0, traverse_1.traverseList)(data, "streamingData", "adaptiveFormats"),
        }, types_1.SongFull);
    }
    static parseSearchResult(item) {
        var _a;
        const columns = (0, traverse_1.traverseList)(item, "flexColumns", "runs");
        const menu = (0, traverse_1.traverseList)(item, "menu", "items");
        const views = columns.find(obj => obj.text.includes("plays") && !obj.navigationEndpoint);
        // It is not possible to identify the title and author
        const title = columns[0];
        const artist = columns[1];
        const artists = columns.filter(filters_1.isArtist);
        const album = (_a = columns.find(filters_1.isAlbum)) !== null && _a !== void 0 ? _a : null;
        const duration = columns.find(filters_1.isDuration);
        return (0, checkType_1.default)({
            type: "SONG",
            videoId: (0, traverse_1.traverseString)(item, "playlistItemData", "videoId"),
            playlistId: (0, traverse_1.traverseString)(menu, "navigationEndpoint", "playlistId"),
            params: (0, traverse_1.traverseString)(menu, "navigationEndpoint", "params"),
            name: (0, traverse_1.traverseString)(title, "text"),
            artists: artists.map(artist => {
                return {
                    name: (0, traverse_1.traverseString)(artist, "text"),
                    artistId: (0, traverse_1.traverseString)(artist, "browseId") || null,
                };
            }),
            artist: {
                name: (0, traverse_1.traverseString)(artist, "text"),
                artistId: (0, traverse_1.traverseString)(artist, "browseId") || null,
            },
            album: album && {
                name: (0, traverse_1.traverseString)(album, "text"),
                albumId: (0, traverse_1.traverseString)(album, "browseId"),
            },
            views: views ? Parser_1.default.parseViews(views.text) : null,
            duration: duration ? Parser_1.default.parseDuration(duration.text) : null,
            thumbnails: (0, traverse_1.traverseList)(item, "thumbnails"),
        }, types_1.SongDetailed);
    }
    static parseArtistSong(item, artistBasic) {
        const columns = (0, traverse_1.traverseList)(item, "flexColumns", "runs").flat();
        const menu = (0, traverse_1.traverseList)(item, "menu", "items");
        const views = columns.find(obj => obj.text.includes("plays") && !obj.navigationEndpoint);
        const title = columns.find(filters_1.isTitle);
        const artists = columns.filter(filters_1.isArtist);
        const album = columns.find(filters_1.isAlbum);
        const duration = columns.find(filters_1.isDuration);
        return (0, checkType_1.default)({
            type: "SONG",
            videoId: (0, traverse_1.traverseString)(item, "playlistItemData", "videoId"),
            playlistId: (0, traverse_1.traverseString)(menu, "navigationEndpoint", "playlistId"),
            params: (0, traverse_1.traverseString)(menu, "navigationEndpoint", "params"),
            name: (0, traverse_1.traverseString)(title, "text"),
            artists: artists.map(artist => {
                return {
                    name: (0, traverse_1.traverseString)(artist, "text"),
                    artistId: (0, traverse_1.traverseString)(artist, "browseId") || null,
                };
            }),
            artist: artistBasic,
            album: {
                name: (0, traverse_1.traverseString)(album, "text"),
                albumId: (0, traverse_1.traverseString)(album, "browseId"),
            },
            views: views ? Parser_1.default.parseViews(views.text) : null,
            duration: duration ? Parser_1.default.parseDuration(duration.text) : null,
            thumbnails: (0, traverse_1.traverseList)(item, "thumbnails"),
        }, types_1.SongDetailed);
    }
    static parseArtistTopSong(item, artistBasic) {
        const columns = (0, traverse_1.traverseList)(item, "flexColumns", "runs").flat();
        const menu = (0, traverse_1.traverseList)(item, "menu", "items");
        const title = columns.find(filters_1.isTitle);
        const artists = columns.filter(filters_1.isArtist);
        const album = columns.find(filters_1.isAlbum);
        return (0, checkType_1.default)({
            type: "SONG",
            videoId: (0, traverse_1.traverseString)(item, "playlistItemData", "videoId"),
            playlistId: (0, traverse_1.traverseString)(menu, "navigationEndpoint", "playlistId"),
            params: (0, traverse_1.traverseString)(menu, "navigationEndpoint", "params"),
            name: (0, traverse_1.traverseString)(title, "text"),
            artists: artists.map(artist => {
                return {
                    name: (0, traverse_1.traverseString)(artist, "text"),
                    artistId: (0, traverse_1.traverseString)(artist, "browseId") || null,
                };
            }),
            artist: artistBasic,
            album: {
                name: (0, traverse_1.traverseString)(album, "text"),
                albumId: (0, traverse_1.traverseString)(album, "browseId"),
            },
            views: null,
            duration: null,
            thumbnails: (0, traverse_1.traverseList)(item, "thumbnails"),
        }, types_1.SongDetailed);
    }
    static parseAlbumSong(item, artistBasic, albumBasic, thumbnails) {
        const columns = (0, traverse_1.traverseList)(item, "flexColumns", "runs").flat();
        const menu = (0, traverse_1.traverseList)(item, "menu", "items");
        const views = columns.find(obj => obj.text.includes("plays") && !obj.navigationEndpoint);
        const title = columns.find(filters_1.isTitle);
        const artists = columns.filter(filters_1.isArtist);
        const duration = columns.find(filters_1.isDuration);
        return (0, checkType_1.default)({
            type: "SONG",
            videoId: (0, traverse_1.traverseString)(item, "playlistItemData", "videoId"),
            playlistId: (0, traverse_1.traverseString)(menu, "navigationEndpoint", "playlistId"),
            params: (0, traverse_1.traverseString)(menu, "navigationEndpoint", "params"),
            name: (0, traverse_1.traverseString)(title, "text"),
            artists: artists.map(artist => {
                return {
                    name: (0, traverse_1.traverseString)(artist, "text"),
                    artistId: (0, traverse_1.traverseString)(artist, "browseId") || null,
                };
            }),
            artist: artistBasic,
            album: albumBasic,
            views: views ? Parser_1.default.parseViews(views.text) : null,
            duration: duration ? Parser_1.default.parseDuration(duration.text) : null,
            thumbnails,
        }, types_1.SongDetailed);
    }
}
exports.default = SongParser;
