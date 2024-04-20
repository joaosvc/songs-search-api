"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEARCH_OPTIONS = exports.ISRC_REGEX = void 0;
exports.ISRC_REGEX = /^[A-Z]{2}-?\w{3}-?\d{2}-?\d{5}$/;
exports.SEARCH_OPTIONS = [
    { filter: "songs", limit: 50 },
    { filter: "videos", limit: 50 },
];
