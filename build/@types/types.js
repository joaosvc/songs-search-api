"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIMPLE_LINK_METADATA = exports.SEARCH_OPTIONS_TYPE = exports.SearchAlbumsResultMetadata = exports.SearchResultMetadata = exports.SongResult = exports.SongList = exports.Song = void 0;
const arktype_1 = require("arktype");
exports.Song = (0, arktype_1.type)({
    name: "string",
    url: "string",
    image: "string",
    songId: "string",
    album: "string",
    artist: "string",
    artists: ["string", "[]"],
    isrc: (0, arktype_1.union)("string", "null"),
    duration: "number",
});
exports.SongList = (0, arktype_1.type)({
    songs: [exports.Song, "[]"],
});
exports.SongResult = (0, arktype_1.type)({
    source: (0, arktype_1.union)('"YoutubeMusic"', '"slider.kz"'),
    name: "string",
    url: "string",
    songId: "string",
    album: "string",
    artist: "string",
    artists: ["string", "[]"],
    verified: "boolean",
    isrcSearch: "boolean",
    searchQuery: "string",
    duration: "number",
    views: "number",
});
exports.SearchResultMetadata = (0, arktype_1.type)({
    songs: [exports.Song, "[]"],
    offset: "number",
    limit: "number",
    hasMore: "boolean",
    nextId: (0, arktype_1.union)("string", "null"),
    nextOffset: (0, arktype_1.union)("number", "null"),
});
exports.SearchAlbumsResultMetadata = (0, arktype_1.type)({
    albums: ["string", "[]"],
    offset: "number",
    limit: "number",
    hasMore: "boolean",
    nextId: (0, arktype_1.union)("string", "null"),
    nextOffset: (0, arktype_1.union)("number", "null"),
});
exports.SEARCH_OPTIONS_TYPE = (0, arktype_1.type)({
    filter: (0, arktype_1.union)('"songs"', '"videos"'),
    limit: "number",
});
exports.SIMPLE_LINK_METADATA = (0, arktype_1.type)({
    success: "boolean",
    message: "string",
    link: (0, arktype_1.union)("string", "null"),
});
