"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const jsdom_1 = require("jsdom");
class Genius {
    constructor(token = "alXXDbPZtK1m2RrZ8I4k2Hn8Ahsd0Gh_o076HYvcdlBvmc0ULL1H8Z8xRlew5qaG") {
        this.token = token;
        this.client = axios_1.default.create({
            baseURL: "https://api.genius.com/",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            timeout: 10000,
        });
    }
    getResults(name, artists) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const artistsStr = artists.join(", ");
            const title = `${name} - ${artistsStr}`;
            try {
                const response = yield this.client.get("search", {
                    params: { q: title },
                });
                const hits = response.data.response.hits;
                const results = {};
                hits.forEach((hit) => {
                    results[hit.result.full_title] = hit.result.id;
                });
                return results;
            }
            catch (error) {
                console.error("Error retrieving results:", error);
                return {};
            }
        });
    }
    extractLyrics(url) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const songResponse = yield this.client.get(`songs/${url}`);
                const songUrl = songResponse.data.response.song.url;
                let lyrics = "";
                let counter = 0;
                let soup = null;
                while (counter < 4) {
                    const geniusPageResponse = yield this.client.get(songUrl);
                    if (!(geniusPageResponse.status === 200)) {
                        counter++;
                        continue;
                    }
                    const dom = new jsdom_1.JSDOM(geniusPageResponse.data);
                    soup = dom.window.document;
                    break;
                }
                if (!soup) {
                    return null;
                }
                const lyricsDiv = soup.querySelector("div.lyrics");
                const lyricsContainers = soup.querySelectorAll("div[class^=Lyrics__Container]");
                if (lyricsDiv) {
                    lyrics = lyricsDiv.textContent || "";
                }
                else if (lyricsContainers.length > 0) {
                    lyricsContainers.forEach((container) => {
                        lyrics += container.textContent || "";
                    });
                }
                else {
                    return null;
                }
                if (!lyrics) {
                    return null;
                }
                lyrics = lyrics.trim();
                ["desc", "Desc"].forEach((toRemove) => {
                    lyrics = lyrics.replace(toRemove, "");
                });
                return lyrics.trim();
            }
            catch (error) {
                console.error("Error extracting lyrics:", error);
                return null;
            }
        });
    }
}
exports.default = Genius;
