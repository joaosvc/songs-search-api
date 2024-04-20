"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mathing_1 = require("../utils/mathing");
const search_options_1 = require("../utils/search-options");
const ytmusic_1 = tslib_1.__importDefault(require("../providers/audio/ytmusic"));
const formatter_1 = tslib_1.__importDefault(require("../utils/formatter"));
class YoutubeSearch {
    static fromParams(params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const song = params;
            try {
                const youtubeUrl = yield this.search(song);
                return {
                    success: true,
                    message: "Simple link generated successfully",
                    link: youtubeUrl,
                };
            }
            catch (error) {
                console.error("Error generating simple link:", error);
                return {
                    success: false,
                    message: "Error generating simple link",
                    link: null,
                };
            }
        });
    }
    static search(song_1) {
        return tslib_1.__awaiter(this, arguments, void 0, function* (song, onlyVerified = false, filterResults = true) {
            let youtubeUrl = null;
            const searchQuery = formatter_1.default.createSongTitle(song.name, song.artists).toLowerCase();
            // It is not necessary to process the url
            // Reason? what we are looking for is the youtube url
            if (!song.url.includes("youtube.com/watch?v")) {
                let isrcResultsUrl = [];
                if (song.isrc) {
                    const isrcResults = (yield this.getResults(song.isrc, search_options_1.SEARCH_OPTIONS[0])).filter((songResult) => !onlyVerified || songResult.verified);
                    const sortedIsrcResults = (0, mathing_1.orderResults)(isrcResults, song);
                    isrcResultsUrl = isrcResults.map((result) => result.url);
                    (0, mathing_1.mathingLogger)(`[${song.songId}] Found ${isrcResults.length} results for ISRC ${song.isrc}`);
                    if (isrcResults.length > 0) {
                        const bestIsrcResults = Object.entries(sortedIsrcResults)
                            .filter(([score]) => Number(score) >= 80)
                            .sort((a, b) => Number(b[0]) - Number(a[0]));
                        (0, mathing_1.mathingLogger)(`[${song.songId}] Filtered to ${bestIsrcResults.length} ISRC results`);
                        if (bestIsrcResults.length > 0) {
                            const [score, bestIsrc] = bestIsrcResults[0];
                            (0, mathing_1.mathingLogger)(`[${song.songId}] Best ISRC result is ${bestIsrc.url} with score ${score}`);
                            youtubeUrl = bestIsrc.url;
                        }
                    }
                }
                if (youtubeUrl === null) {
                    let results = {};
                    yield Promise.all(search_options_1.SEARCH_OPTIONS.map((options) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        const searchResults = (yield this.getResults(searchQuery, options)).filter((songResult) => !onlyVerified || songResult.verified);
                        (0, mathing_1.mathingLogger)(`[${song.songId}] Found ${searchResults.length} results for search query ${searchQuery} with filter: ${options.filter}, limit: ${options.limit}`);
                        const isrcResult = searchResults.find((result) => isrcResultsUrl.includes(result.url));
                        if (isrcResult) {
                            (0, mathing_1.mathingLogger)(`[${song.songId}] Best ISRC result is ${isrcResult.url}`);
                            youtubeUrl = isrcResult.url;
                        }
                        else {
                            (0, mathing_1.mathingLogger)(`[${song.songId}] Have to filter results: ${filterResults}`);
                            let newResults = {};
                            if (filterResults) {
                                newResults = (0, mathing_1.orderResults)(searchResults, song);
                            }
                            else {
                                if (searchResults.length > 0) {
                                    newResults[100] = searchResults[0];
                                }
                            }
                            const newResultsKeys = Object.keys(newResults);
                            (0, mathing_1.mathingLogger)(`[${song.songId}] Filtered to ${newResultsKeys.length} results`);
                            if (newResultsKeys.length !== 0) {
                                const [bestScore, bestResult] = (0, mathing_1.getBestResult)(newResults);
                                (0, mathing_1.mathingLogger)(`[${song.songId}] Best result is ${bestResult.url} with score ${bestScore}`);
                                if (bestScore >= 80 && bestResult.verified) {
                                    (0, mathing_1.mathingLogger)("[%s] Returning verified best result %s with score %s", song.songId, bestResult.url, bestScore);
                                    youtubeUrl = bestResult.url;
                                }
                                else {
                                    results = Object.assign(Object.assign({}, results), newResults);
                                }
                            }
                        }
                    })));
                    if (youtubeUrl === null) {
                        if (Object.keys(results).length > 0) {
                            const [bestScore, bestResult] = (0, mathing_1.getBestResult)(results);
                            (0, mathing_1.mathingLogger)(`[${song.songId}] Returning best result ${bestResult.url} with score ${bestScore}`);
                            youtubeUrl = bestResult.url;
                        }
                        else {
                            (0, mathing_1.mathingLogger)(`[${song.songId}] No results found`);
                        }
                    }
                }
            }
            else {
                youtubeUrl = song.url;
            }
            return youtubeUrl;
        });
    }
    static getResults(searchTerm, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let searchResults = [];
            try {
                if (options.filter === "songs") {
                    searchResults = yield ytmusic_1.default.searchSongs(searchTerm);
                }
                else if (options.filter === "videos") {
                    searchResults = yield ytmusic_1.default.searchVideos(searchTerm);
                }
                else {
                    searchResults = yield ytmusic_1.default.search(searchTerm);
                }
            }
            catch (error) {
                console.error(`Error rettriving YouTubeMusic result as options ${JSON.stringify(options)}:`, error);
            }
            if (searchResults.length > options.limit) {
                searchResults = searchResults.slice(0, options.limit);
            }
            return searchResults.map((result) => {
                var _a, _b;
                const isrcResult = searchTerm.match(search_options_1.ISRC_REGEX);
                const artists = result.artists.map((artist) => artist.name);
                return {
                    source: "YoutubeMusic",
                    name: result.name,
                    url: `https://${result.type === "SONG" ? "music" : "www"}.youtube.com/watch?v=${result.videoId}`,
                    songId: result.videoId,
                    album: (_b = (_a = result.album) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "",
                    verified: result.type === "SONG",
                    artist: result.artist.name,
                    artists: artists,
                    isrcSearch: isrcResult != null,
                    searchQuery: searchTerm,
                    explicit: null,
                    duration: +result.duration,
                    views: +result.views,
                };
            });
        });
    }
}
exports.default = YoutubeSearch;
