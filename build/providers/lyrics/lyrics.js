"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LyricsProvider = exports.LyricsError = void 0;
const tslib_1 = require("tslib");
const genius_1 = tslib_1.__importDefault(require("./types/genius"));
const formatter_1 = tslib_1.__importDefault(require("../../utils/formatter"));
class LyricsError extends Error {
    constructor(message) {
        super(message);
        this.name = "LyricsError";
    }
}
exports.LyricsError = LyricsError;
class LyricsProvider {
    constructor(lyrics = ["genius"]) {
        this.lyricsClass = {
            genius: genius_1.default,
        };
        this.lyrics = [];
        this.lyrics = lyrics.map((lyric) => {
            if (this.lyricsClass[lyric]) {
                return new this.lyricsClass[lyric]();
            }
            throw new LyricsError(`Lyrics provider ${lyric} not found`);
        });
    }
    searchLyrics(song) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const provider of this.lyrics) {
                try {
                    const lyrics = yield this.getLyricsFromProvider(provider, song.name, song.artists);
                    if (lyrics !== null) {
                        return lyrics;
                    }
                }
                catch (error) {
                    console.error("Error rettring lyrics from", provider, error);
                }
            }
            return null;
        });
    }
    getLyricsFromProvider(provider, name, artists) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const results = yield provider.getResults(name, artists);
                const resultsWithScore = {};
                for (const [title, url] of Object.entries(results)) {
                    const resultTitle = formatter_1.default.slugify(title);
                    const matchTitle = formatter_1.default.slugify(`${name} - ${artists.join(", ")}`);
                    const [resList, songList] = formatter_1.default.basedSort(resultTitle.split("-"), matchTitle.split("-"));
                    const sortedResultTitle = resList.join("-");
                    const sortedMatchTitle = songList.join("-");
                    const score = formatter_1.default.ratio(sortedResultTitle, sortedMatchTitle);
                    resultsWithScore[score] = String(url);
                }
                const resultsWithScoreKeys = Object.keys(resultsWithScore);
                if (resultsWithScoreKeys.length === 0) {
                    return null;
                }
                const highestScore = Math.max(...resultsWithScoreKeys.map(Number));
                if (highestScore < 55) {
                    return null;
                }
                return yield provider.extractLyrics(resultsWithScore[highestScore]);
            }
            catch (error) {
                console.error("Error retrieving lyrics from provider", error);
                return null;
            }
        });
    }
}
exports.LyricsProvider = LyricsProvider;
