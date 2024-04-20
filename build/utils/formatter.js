"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatterError = void 0;
const tslib_1 = require("tslib");
const slugify_1 = tslib_1.__importDefault(require("slugify"));
const string_similarity_1 = tslib_1.__importDefault(require("string-similarity"));
class FormatterError extends Error {
    constructor(message) {
        super(message);
        this.name = "FormatterError";
    }
}
exports.FormatterError = FormatterError;
class Formatter {
    static createSongTitle(songName, artists) {
        const joinedArtists = artists.join(", ");
        if (artists.length >= 1) {
            return `${joinedArtists} - ${songName}`;
        }
        return songName;
    }
    static sanitizeString(string) {
        return (string
            // Disallowed characters for Windows file system
            .replace(/[\/\\:*?"<>|]/g, "")
            // Replace double quotes (")
            .replace(/"/g, "'")
            // Replace semi-colons (:)
            .replace(/:/g, "-"));
    }
    static slugify(string) {
        return (0, slugify_1.default)(string, { lower: true });
    }
    static createSearchQuery(song, template, sanitize, fileExtension = null, short = false) {
        const VARS = ["{artist}", "{title}"];
        // If template does not contain any of the keys,
        // append {artist} - {title} at the beginning of the template
        if (!VARS.some((key) => template.includes(key))) {
            template = `{${song.artist}} - {${song.name}}${template}`;
        }
        return Formatter.formatQuery(song, template, sanitize, fileExtension, short);
    }
    static formatQuery(song, template, santitize, fileExtension = null, short = false) {
        if (template.includes("{output-ext}") && fileExtension === null) {
            throw new FormatterError("fileExtension is null, but template contains {output-ext}");
        }
        const formats = {
            "{title}": song.name,
            "{artists}": short ? song.artists[0] : song.artists.join(", "),
            "{artist}": song.artist,
            "{album}": song.album,
            "{duration}": song.duration,
            "{isrc}": song.isrc,
            "{track-id}": song.songId,
            "{output-ext}": fileExtension,
        };
        // Remove artists from the list that are already in the title
        const artists = song.artists.filter((artist) => !Formatter.slugify(artist).includes(Formatter.slugify(song.name)));
        // Add the main artist again to the list
        if (artists.length === 0 || artists[0] !== song.artists[0]) {
            artists.unshift(song.artists[0]);
        }
        if (santitize) {
            // Sanitize the values in the formats object
            for (const key in formats) {
                if (formats[key] !== null) {
                    formats[key] = Formatter.sanitizeString(formats[key].toString());
                }
            }
        }
        // Replace all the keys with the values
        for (const key in formats) {
            template = template.replace(key, formats[key].toString());
        }
        return template;
    }
    static sortString(strings, joinStr) {
        const finalStr = [...strings];
        finalStr.sort();
        return finalStr.join(joinStr);
    }
    static basedSort(strings, basedOn) {
        // Sorting both input lists
        strings.sort();
        basedOn.sort();
        // Creating a map to store the index of each string in basedOn list
        const listMap = {};
        basedOn.forEach((value, index) => {
            listMap[value] = index;
        });
        // Sorting strings list based on the order of strings in basedOn list
        strings.sort((a, b) => {
            const indexA = listMap[a] !== undefined ? listMap[a] : -1;
            const indexB = listMap[b] !== undefined ? listMap[b] : -1;
            return indexB - indexA;
        });
        // Reversing basedOn list
        basedOn.reverse();
        return [strings, basedOn];
    }
    static ratio(string1, string2) {
        return string_similarity_1.default.compareTwoStrings(string1, string2) * 100;
    }
    static fillString(strings, mainString, stringToCheck) {
        let finalStr = mainString;
        const testStr = finalStr.replace(/-/g, "");
        const simpleTestStr = stringToCheck.replace(/-/g, "");
        for (const string of strings) {
            const slugStr = Formatter.slugify(string).replace(/-/g, "");
            if (simpleTestStr.includes(slugStr) && !testStr.includes(slugStr)) {
                finalStr += `-${slugStr}`;
            }
        }
        return finalStr;
    }
    static createCleanString(words, inputString, sort = false, joinStr = "-") {
        const string = Formatter.slugify(inputString).replace(/-/g, "");
        const final = [];
        for (const word of words) {
            const slugWord = Formatter.slugify(word).replace(/-/g, "");
            if (slugWord.includes(string)) {
                continue;
            }
            final.push(slugWord);
        }
        if (sort) {
            return Formatter.sortString(final, joinStr);
        }
        return final.join(joinStr);
    }
    static getMaxImageUrl(images) {
        if (images.length === 0) {
            return null;
        }
        let maxAreaImage = images[0];
        let maxArea = maxAreaImage.width * maxAreaImage.height;
        for (let i = 1; i < images.length; i++) {
            const area = images[i].width * images[i].height;
            if (area > maxArea) {
                maxArea = area;
                maxAreaImage = images[i];
            }
        }
        return maxAreaImage.url;
    }
}
exports.default = Formatter;
