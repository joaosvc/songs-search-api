"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBestMatches = exports.getBestResult = exports.orderResults = exports.mathingLogger = void 0;
const tslib_1 = require("tslib");
const formatter_1 = tslib_1.__importDefault(require("./formatter"));
const FORBIDDEN_WORDS = [
    "bassboosted",
    "remix",
    "remastered",
    "remaster",
    "reverb",
    "bassboost",
    "live",
    "acoustic",
    "8daudio",
    "concert",
    "live",
    "acapella",
    "slowed",
    "instrumental",
    "remix",
    "cover",
    "reverb",
];
const mathingLogger = (...args) => {
    // Method not implemented
    // console.log(...args);
};
exports.mathingLogger = mathingLogger;
const orderResults = (results, song) => {
    // Assign an overall avg match value to each result
    const linksWithMatchValue = {};
    // Iterate over all results
    for (const result of results) {
        (0, exports.mathingLogger)(song.songId, result.songId, `Calculating match value for ${result.url}`);
        // skip results that have no common words in their name
        if (!checkCommonWord(song, result)) {
            (0, exports.mathingLogger)(song.songId, result.songId, "Skipping result due to no common words");
            continue;
        }
        // Calculate match value for main artist
        let artistsMatch = calcMainArtistMatch(song, result);
        (0, exports.mathingLogger)(song.songId, result.songId, `Main artist match: ${artistsMatch}`);
        // Calculate match value for all artists
        const otherArtistsMatch = calcArtistsMatch(song, result);
        (0, exports.mathingLogger)(song.songId, result.songId, `Other artists match: ${otherArtistsMatch}`);
        artistsMatch += otherArtistsMatch;
        // Calculate initial artist match value
        (0, exports.mathingLogger)(song.songId, result.songId, `Initial artists match: ${artistsMatch}`);
        artistsMatch /= song.artists.length > 1 ? 2 : 1;
        (0, exports.mathingLogger)(song.songId, result.songId, `First artists match: ${artistsMatch}`);
        // First attempt to fix artist match
        artistsMatch = artistsMatchFixup1(song, result, artistsMatch);
        (0, exports.mathingLogger)(song.songId, result.songId, `Artists match after fixup1: ${artistsMatch}`);
        //  Second attempt to fix artist match
        artistsMatch = artistsMatchFixup2(song, result, artistsMatch);
        (0, exports.mathingLogger)(song.songId, result.songId, `Artists match after fixup2: ${artistsMatch}`);
        // Third attempt to fix artist match
        artistsMatch = artistsMatchFixup3(song, result, artistsMatch);
        (0, exports.mathingLogger)(song.songId, result.songId, `Artists match after fixup3: ${artistsMatch}`);
        (0, exports.mathingLogger)(song.songId, result.songId, `Final artists match: ${artistsMatch}`);
        // Calculate name match
        let nameMatch = calcNameMatch(song, result);
        (0, exports.mathingLogger)(song.songId, result.songId, `Initial name match: ${nameMatch}`);
        // Check if result contains forbidden words
        const [containsForbiddenWords, foundForbiddenWords] = checkForbiddenWords(song, result);
        if (containsForbiddenWords) {
            for (const word of foundForbiddenWords) {
                nameMatch -= 15;
            }
        }
        (0, exports.mathingLogger)(song.songId, result.songId, `Contains forbidden words: ${containsForbiddenWords}, ${foundForbiddenWords}`);
        (0, exports.mathingLogger)(song.songId, result.songId, `Final name match: ${nameMatch}`);
        // Calculate album match
        const albumMatch = calcAlbumMatch(song, result);
        (0, exports.mathingLogger)(song.songId, result.songId, `Final album match: ${albumMatch}`);
        // Calculate time match
        const timeMatch = calcTimeMatch(song, result);
        (0, exports.mathingLogger)(song.songId, result.songId, `Final time match: ${timeMatch}`);
        // Ignore results with name match lower than 60%
        if (nameMatch <= 60) {
            (0, exports.mathingLogger)(song.songId, result.songId, "Skipping result due to name match lower than 60%");
            continue;
        }
        // Ignore results with artists match lower than 70%
        if (artistsMatch < 70 && result.source !== "slider.kz") {
            (0, exports.mathingLogger)(song.songId, result.songId, "Skipping result due to artists match lower than 70%");
            continue;
        }
        // Calculate total match
        let averageMatch = (artistsMatch + nameMatch) / 2;
        (0, exports.mathingLogger)(song.songId, result.songId, `Average match: ${averageMatch}`);
        if (result.verified &&
            !result.isrcSearch &&
            result.album &&
            albumMatch <= 80) {
            // we are almost certain that this is the correct result
            // so we add the album match to the average match
            averageMatch = (averageMatch + albumMatch) / 2;
            (0, exports.mathingLogger)(song.songId, result.songId, `Average match /w album match: ${averageMatch}`);
        }
        // Skip results with time match lower than 25%
        if (timeMatch < 25) {
            (0, exports.mathingLogger)(song.songId, result.songId, "Skipping result due to time match lower than 25%");
            continue;
        }
        // If the time match is lower than 50%
        // and the average match is lower than 75%
        // we skip the result
        if (timeMatch < 50 && averageMatch < 75) {
            (0, exports.mathingLogger)(song.songId, result.songId, "Skipping result due to time match < 50% and average match < 75%");
            continue;
        }
        if ((!result.isrcSearch && averageMatch <= 85) ||
            result.source === "slider.kz" ||
            timeMatch < 0) {
            // Don't add time to avg match if average match is not the best
            // (lower than 85%), always include time match if result is from
            // slider.kz or if time match is lower than 0
            averageMatch = (averageMatch + timeMatch) / 2;
        }
        averageMatch = Math.min(averageMatch, 100);
        (0, exports.mathingLogger)(song.songId, result.songId, `Final average match: ${averageMatch}`);
        linksWithMatchValue[averageMatch] = result;
    }
    return linksWithMatchValue;
};
exports.orderResults = orderResults;
const getBestResult = (results) => {
    var _a;
    const bestResults = (0, exports.getBestMatches)(results, 8);
    if (bestResults.length === 1) {
        return bestResults[0];
    }
    // Best initial result based on average match
    const bestResult = bestResults[0];
    // If the best result has a score greater than 80%
    // and for an ISRC search, we return it
    if (bestResult[0] > 80 && bestResult[1].isrcSearch) {
        return bestResult;
    }
    // If we have more than one result,
    // we return the one with the highest score
    // and more views
    if (bestResults.length > 1) {
        const views = [];
        for (const [score, result] of bestResults) {
            views.push(+((_a = result.views) !== null && _a !== void 0 ? _a : 0));
        }
        const highestViews = Math.max(...views);
        const lowestViews = Math.min(...views);
        if (highestViews === 0 || highestViews === lowestViews) {
            return [bestResult[0], bestResult[1]];
        }
        const weightedResults = [];
        for (const [score, result] of bestResults) {
            const resultViews = views[bestResults.indexOf([score, result])];
            const viewsScore = ((resultViews - lowestViews) / (highestViews - lowestViews)) * 15;
            const calculatedScore = Math.min(score + viewsScore, 100);
            weightedResults.push([calculatedScore, result]);
        }
        // Now we return the result with the highest score
        return weightedResults.reduce((prev, curr) => prev[1] > curr[1] ? prev : curr);
    }
    return [bestResult[0], bestResult[1]];
};
exports.getBestResult = getBestResult;
const getBestMatches = (results, scoreThreshold) => {
    const resultItems = Object.entries(results);
    const sortedResults = resultItems.sort(([a], [b]) => Number(b) - Number(a));
    const bestScore = sortedResults[0][0];
    return sortedResults
        .filter(([score]) => Number(bestScore) - Number(score) <= scoreThreshold)
        .map(([score, result]) => [Number(score), result]);
};
exports.getBestMatches = getBestMatches;
const calcTimeMatch = (song, result) => {
    const timeDiff = Math.abs(song.duration - result.duration);
    const score = Math.exp(-0.1 * timeDiff);
    return score * 100;
};
const calcAlbumMatch = (song, result) => {
    if (!result.album) {
        return 0.0;
    }
    return formatter_1.default.ratio(formatter_1.default.slugify(song.album), formatter_1.default.slugify(result.album));
};
const checkForbiddenWords = (song, result) => {
    const songName = formatter_1.default.slugify(song.name).replace(/-/g, "");
    const toCheck = formatter_1.default.slugify(result.name).replace(/-/g, "");
    const words = [];
    for (const word of FORBIDDEN_WORDS) {
        if (toCheck.includes(word) && !songName.includes(word)) {
            words.push(word);
        }
    }
    return [words.length > 0, words];
};
const calcNameMatch = (song, result, searchQuery) => {
    // Create match strings that will be used
    // to calculate name match value
    const [matchStr1, matchStr2] = createMatchStrings(song, result, searchQuery);
    const resultName = formatter_1.default.slugify(result.name);
    const songName = formatter_1.default.slugify(song.name);
    const [resList, songList] = formatter_1.default.basedSort(resultName.split("-"), songName.split("-"));
    const sortedResultName = resList.join("-");
    const sortedSongName = songList.join("-");
    // Calculate initial name match
    let nameMatch = formatter_1.default.ratio(sortedResultName, sortedSongName);
    (0, exports.mathingLogger)(`${song.songId} ${result.songId} MATCH STRINGS: ${matchStr1} - ${matchStr2}`);
    (0, exports.mathingLogger)(`${song.songId} ${result.songId} SLUG MATCH STRINGS: ${sortedSongName} - ${sortedResultName}`);
    (0, exports.mathingLogger)(`${song.songId} ${result.songId} First name match: ${nameMatch}`);
    // If name match is lower than 60%,
    // we try to match using the test strings
    if (nameMatch <= 75) {
        const secondNameMatch = formatter_1.default.ratio(matchStr1, matchStr2);
        (0, exports.mathingLogger)(`${song.songId} ${result.songId} Second name match: ${secondNameMatch}`);
        nameMatch = Math.max(nameMatch, secondNameMatch);
    }
    return nameMatch;
};
const artistsMatchFixup1 = (song, result, score) => {
    // If we have a verified result, we don't have to fix anything
    if (result.verified || score > 50) {
        return score;
    }
    // If we didn't find any artist match,
    // we fallback to channel name match
    const channelNameMatch = formatter_1.default.ratio(formatter_1.default.slugify(song.artist), formatter_1.default.slugify(result.artists ? result.artists.join(", ") : ""));
    score = Math.max(score, channelNameMatch);
    // If artist match is still too low,
    // we fallback to matching all song artist names
    // with the result's title
    if (score <= 70) {
        let artistTitleMatch = 0.0;
        const resultName = formatter_1.default.slugify(result.name).replace("-", "");
        for (const artist of song.artists) {
            const slugArtist = formatter_1.default.slugify(artist).replace("-", "");
            if (resultName.includes(slugArtist)) {
                artistTitleMatch += 1.0;
            }
        }
        artistTitleMatch = (artistTitleMatch / song.artists.length) * 100;
        score = Math.max(score, artistTitleMatch);
    }
    return score;
};
const artistsMatchFixup2 = (song, result, score, searchQuery) => {
    var _a, _b;
    if (score > 70 || !result.verified) {
        // Don't fixup the score
        // if the artist match is already high
        // or if the result is not verified
        return score;
    }
    // Check if the main artist is simlar
    const hasMainArtist = score / (song.artists.length > 1 ? 2 : 1) > 50;
    const [, matchStr2] = createMatchStrings(song, result, searchQuery);
    // Check if other song artists are in the result name
    // if they are, we increase the artist match
    // (main artist is already checked, so we skip it)
    const artistsToCheck = song.artists.slice(hasMainArtist ? 1 : 0);
    for (const artist of artistsToCheck) {
        const slugArtist = formatter_1.default.slugify(artist).replace("-", "");
        if (matchStr2.replace("-", "").includes(slugArtist)) {
            score += 5;
        }
    }
    // if the artist match is still too low,
    // we fallback to matching all song artist names
    // with the result's artists
    if (score <= 70) {
        // Artists from song/result name without the song/result name words
        const artistList1 = formatter_1.default.createCleanString(song.artists, formatter_1.default.slugify(song.name), true);
        const artistList2 = formatter_1.default.createCleanString((_a = result.artists) !== null && _a !== void 0 ? _a : [(_b = result.artist) !== null && _b !== void 0 ? _b : ""], formatter_1.default.slugify(result.name), true);
        const artistTitleMatch = formatter_1.default.ratio(artistList1, artistList2);
        score = Math.max(score, artistTitleMatch);
    }
    return score;
};
const artistsMatchFixup3 = (song, result, score) => {
    if (score > 70 ||
        !result.artists ||
        result.artists.length !== 1 ||
        song.artists.length === 1) {
        // Don't fixup the score
        // if the score is already high
        // or if the result has more than one artist
        // or if the song has only one artist
        return score;
    }
    const artistsScoreFixup = formatter_1.default.ratio(formatter_1.default.slugify(result.name), formatter_1.default.slugify(formatter_1.default.createSongTitle(song.name, [song.artist])));
    if (artistsScoreFixup >= 80) {
        score = (score + artistsScoreFixup) / 2;
    }
    // Make sure that the score is not higher than 100
    score = Math.min(score, 100);
    return score;
};
const calcArtistsMatch = (song, result) => {
    let artistMatchNumber = 0.0;
    // Result has only one artist, return 0.0
    if (song.artists.length === 1 ||
        !result.artists ||
        result.artists.length === 0) {
        return artistMatchNumber;
    }
    const [artist1List, artist2List] = formatter_1.default.basedSort(song.artists.map(formatter_1.default.slugify), result.artists.map(formatter_1.default.slugify));
    // Remove main artist from the lists
    const trimmedArtist1List = artist1List.slice(1);
    const trimmedArtist2List = artist2List.slice(1);
    let artistsMatch = 0.0;
    const maxLength = Math.max(trimmedArtist1List.length, trimmedArtist2List.length);
    for (let i = 0; i < maxLength; i++) {
        const artist1 = trimmedArtist1List[i];
        const artist2 = trimmedArtist2List[i];
        const artist12Match = formatter_1.default.ratio(artist1 || "", artist2 || "");
        artistsMatch += artist12Match;
    }
    artistMatchNumber = artistsMatch / trimmedArtist1List.length;
    return artistMatchNumber;
};
const calcMainArtistMatch = (song, result) => {
    let mainArtistMatch = 0.0;
    // Verifica se result.artists está vazio
    if (!result.artists || result.artists.length === 0) {
        return mainArtistMatch;
    }
    const songArtists = song.artists.map((artist) => formatter_1.default.slugify(artist));
    const resultArtists = result.artists.map((artist) => formatter_1.default.slugify(artist));
    const [sortedSongArtists, sortedResultArtists] = formatter_1.default.basedSort(songArtists, resultArtists);
    (0, exports.mathingLogger)(`${song.songId} ${result.songId} Song artists: ${JSON.stringify(sortedSongArtists)}`);
    (0, exports.mathingLogger)(`${song.songId} ${result.songId} Result artists: ${JSON.stringify(sortedResultArtists)}`);
    const slugSongMainArtist = formatter_1.default.slugify(song.artists[0]);
    const slugResultMainArtist = sortedResultArtists[0];
    // Result has only one artist, but song has multiple artists
    // we can assume that other artists are in the main artist name
    if (song.artists.length > 1 && result.artists.length === 1) {
        for (const artist of song.artists.slice(1)) {
            const slugifiedArtist = formatter_1.default.slugify(artist);
            const sortedArtist = formatter_1.default.sortString(slugifiedArtist.split("-"), "-");
            const sortedResultMainArtist = formatter_1.default.sortString(slugResultMainArtist.split("-"), "-");
            if (sortedResultMainArtist.includes(sortedArtist)) {
                mainArtistMatch += 100 / song.artists.length;
            }
        }
        return mainArtistMatch;
    }
    // Match main result artist with main song artist
    mainArtistMatch = formatter_1.default.ratio(slugSongMainArtist, slugResultMainArtist);
    (0, exports.mathingLogger)(`${song.songId} ${result.songId} First main artist match: ${mainArtistMatch}`);
    // Use second artist from the sorted list to
    // calculate the match if the first artist match is too low
    if (mainArtistMatch < 50 && songArtists.length > 1) {
        for (let index = 0; index < 2; index++) {
            const newArtistMatch = formatter_1.default.ratio(songArtists[index], sortedResultArtists[index]);
            (0, exports.mathingLogger)(`${song.songId} ${result.songId} Matched ${songArtists[index]} with ${sortedResultArtists[index]}: ${newArtistMatch}`);
            mainArtistMatch = Math.max(mainArtistMatch, newArtistMatch);
        }
    }
    return mainArtistMatch;
};
const createMatchStrings = (song, result, searchQuery) => {
    const slugSongName = formatter_1.default.slugify(song.name);
    const slugSongTitle = formatter_1.default.slugify(formatter_1.default.createSongTitle(song.name, song.artists) ||
        (searchQuery
            ? formatter_1.default.createSearchQuery(song, searchQuery, false, null, true)
            : ""));
    let testStr1 = formatter_1.default.slugify(result.name);
    let testStr2 = result.verified ? slugSongName : slugSongTitle;
    testStr1 = formatter_1.default.fillString(song.artists, testStr1, testStr2);
    testStr2 = formatter_1.default.fillString(song.artists, testStr2, testStr1);
    const [testList1, testList2] = formatter_1.default.basedSort(testStr1.split("-"), testStr2.split("-"));
    testStr1 = testList1.join("-");
    testStr2 = testList2.join("-");
    return [testStr1, testStr2];
};
const checkCommonWord = (song, result) => {
    const sentenceWords = formatter_1.default.slugify(song.name).split("-");
    const toCheck = formatter_1.default.slugify(result.name).replace("-", "");
    for (const word of sentenceWords) {
        if (word !== "" && toCheck.includes(word)) {
            return true;
        }
    }
    return false;
};
