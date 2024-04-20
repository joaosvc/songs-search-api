"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const types_1 = require("../@types/types");
const checkType_1 = tslib_1.__importDefault(require("../utils/checkType"));
const filters_1 = require("../utils/filters");
const traverse_1 = require("../utils/traverse");
const Parser_1 = tslib_1.__importDefault(require("./Parser"));
class VideoParser {
    static parse(data) {
        return {
            type: "VIDEO",
            videoId: (0, traverse_1.traverseString)(data, "videoDetails", "videoId"),
            name: (0, traverse_1.traverseString)(data, "videoDetails", "title"),
            /**
             * What could this Parse be? How do we get into it?
             * Then we define the main artist in the list
             */
            artists: [
                {
                    artistId: (0, traverse_1.traverseString)(data, "videoDetails", "channelId"),
                    name: (0, traverse_1.traverseString)(data, "author"),
                },
            ],
            artist: {
                artistId: (0, traverse_1.traverseString)(data, "videoDetails", "channelId"),
                name: (0, traverse_1.traverseString)(data, "author"),
            },
            views: +(0, traverse_1.traverseString)(data, "videoDetails", "viewCount"),
            duration: +(0, traverse_1.traverseString)(data, "videoDetails", "lengthSeconds"),
            thumbnails: (0, traverse_1.traverseList)(data, "videoDetails", "thumbnails"),
            unlisted: (0, traverse_1.traverse)(data, "unlisted"),
            familySafe: (0, traverse_1.traverse)(data, "familySafe"),
            paid: (0, traverse_1.traverse)(data, "paid"),
            tags: (0, traverse_1.traverseList)(data, "tags"),
        };
    }
    static parseSearchResult(item) {
        const columns = (0, traverse_1.traverseList)(item, "flexColumns", "runs").flat();
        const menu = (0, traverse_1.traverseList)(item, "menu", "items");
        const views = columns.find(obj => obj.text.includes("views") && !obj.navigationEndpoint);
        const title = columns.find(filters_1.isTitle);
        const artists = columns.filter(filters_1.isArtist);
        const artist = columns.find(filters_1.isArtist) || columns[1];
        const duration = columns.find(filters_1.isDuration);
        return {
            type: "VIDEO",
            videoId: (0, traverse_1.traverseString)(item, "playNavigationEndpoint", "videoId"),
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
                artistId: (0, traverse_1.traverseString)(artist, "browseId") || null,
                name: (0, traverse_1.traverseString)(artist, "text"),
            },
            views: views ? Parser_1.default.parseViews(views.text) : null,
            duration: duration ? Parser_1.default.parseDuration(duration.text) : null,
            thumbnails: (0, traverse_1.traverseList)(item, "thumbnails"),
        };
    }
    static parseArtistTopVideo(item, artistBasic) {
        return {
            type: "VIDEO",
            videoId: (0, traverse_1.traverseString)(item, "videoId"),
            name: (0, traverse_1.traverseString)(item, "runs", "text"),
            artists: [artistBasic],
            artist: artistBasic,
            views: null,
            duration: null,
            thumbnails: (0, traverse_1.traverseList)(item, "thumbnails"),
        };
    }
    static parsePlaylistVideo(item) {
        var _a;
        const columns = (0, traverse_1.traverseList)(item, "flexColumns", "runs").flat();
        const menu = (0, traverse_1.traverseList)(item, "menu", "items");
        const views = columns.find(obj => obj.text.includes("views") && !obj.navigationEndpoint);
        const title = columns.find(filters_1.isTitle) || columns[0];
        const artist = columns.find(filters_1.isArtist) || columns[1];
        const artists = columns.filter(filters_1.isArtist);
        const duration = columns.find(filters_1.isDuration);
        return (0, checkType_1.default)({
            type: "VIDEO",
            videoId: (0, traverse_1.traverseString)(item, "playNavigationEndpoint", "videoId") ||
                ((_a = (0, traverse_1.traverseList)(item, "thumbnails")[0].url.match(/https:\/\/i\.ytimg\.com\/vi\/(.+)\//)) === null || _a === void 0 ? void 0 : _a[1]),
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
            views: views ? Parser_1.default.parseViews(views.text) : null,
            duration: duration ? Parser_1.default.parseDuration(duration.text) : null,
            thumbnails: (0, traverse_1.traverseList)(item, "thumbnails"),
        }, types_1.VideoDetailed);
    }
}
exports.default = VideoParser;
