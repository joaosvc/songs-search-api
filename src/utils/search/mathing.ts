import { Song, SongResult } from "../../@types/types";
import Formatter from "./formatter";

const FORBIDDEN_WORDS: string[] = [
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

export const mathingLogger = (...args: any) => {
  // Method not implemented
  // console.log(...args);
};

export const orderResults = (
  results: SongResult[],
  song: Song
): Record<number, SongResult> => {
  // Assign an overall avg match value to each result
  const linksWithMatchValue: Record<number, SongResult> = {};

  // Iterate over all results
  for (const result of results) {
    mathingLogger(
      song.songId,
      result.songId,
      `Calculating match value for ${result.url}`
    );

    // skip results that have no common words in their name
    if (!checkCommonWord(song, result)) {
      mathingLogger(
        song.songId,
        result.songId,
        "Skipping result due to no common words"
      );
      continue;
    }

    // Calculate match value for main artist
    let artistsMatch = calcMainArtistMatch(song, result);
    mathingLogger(
      song.songId,
      result.songId,
      `Main artist match: ${artistsMatch}`
    );

    // Calculate match value for all artists
    const otherArtistsMatch = calcArtistsMatch(song, result);
    mathingLogger(
      song.songId,
      result.songId,
      `Other artists match: ${otherArtistsMatch}`
    );

    artistsMatch += otherArtistsMatch;

    // Calculate initial artist match value
    mathingLogger(
      song.songId,
      result.songId,
      `Initial artists match: ${artistsMatch}`
    );
    artistsMatch /= song.artists.length > 1 ? 2 : 1;
    mathingLogger(
      song.songId,
      result.songId,
      `First artists match: ${artistsMatch}`
    );

    // First attempt to fix artist match
    artistsMatch = artistsMatchFixup1(song, result, artistsMatch);
    mathingLogger(
      song.songId,
      result.songId,
      `Artists match after fixup1: ${artistsMatch}`
    );

    //  Second attempt to fix artist match
    artistsMatch = artistsMatchFixup2(song, result, artistsMatch);
    mathingLogger(
      song.songId,
      result.songId,
      `Artists match after fixup2: ${artistsMatch}`
    );

    // Third attempt to fix artist match
    artistsMatch = artistsMatchFixup3(song, result, artistsMatch);
    mathingLogger(
      song.songId,
      result.songId,
      `Artists match after fixup3: ${artistsMatch}`
    );

    mathingLogger(
      song.songId,
      result.songId,
      `Final artists match: ${artistsMatch}`
    );

    // Calculate name match
    let nameMatch = calcNameMatch(song, result);
    mathingLogger(
      song.songId,
      result.songId,
      `Initial name match: ${nameMatch}`
    );

    // Check if result contains forbidden words
    const [containsForbiddenWords, foundForbiddenWords] = checkForbiddenWords(
      song,
      result
    );
    if (containsForbiddenWords) {
      for (const word of foundForbiddenWords) {
        nameMatch -= 15;
      }
    }

    mathingLogger(
      song.songId,
      result.songId,
      `Contains forbidden words: ${containsForbiddenWords}, ${foundForbiddenWords}`
    );
    mathingLogger(song.songId, result.songId, `Final name match: ${nameMatch}`);

    // Calculate album match
    const albumMatch = calcAlbumMatch(song, result);
    mathingLogger(
      song.songId,
      result.songId,
      `Final album match: ${albumMatch}`
    );

    // Calculate time match
    const timeMatch = calcTimeMatch(song, result);
    mathingLogger(song.songId, result.songId, `Final time match: ${timeMatch}`);

    // Ignore results with name match lower than 60%
    if (nameMatch <= 60) {
      mathingLogger(
        song.songId,
        result.songId,
        "Skipping result due to name match lower than 60%"
      );
      continue;
    }

    // Ignore results with artists match lower than 70%
    if (artistsMatch < 70 && result.source !== "slider.kz") {
      mathingLogger(
        song.songId,
        result.songId,
        "Skipping result due to artists match lower than 70%"
      );
      continue;
    }

    // Calculate total match
    let averageMatch = (artistsMatch + nameMatch) / 2;
    mathingLogger(song.songId, result.songId, `Average match: ${averageMatch}`);

    if (
      result.verified &&
      !result.isrcSearch &&
      result.album &&
      albumMatch <= 80
    ) {
      // we are almost certain that this is the correct result
      // so we add the album match to the average match
      averageMatch = (averageMatch + albumMatch) / 2;
      mathingLogger(
        song.songId,
        result.songId,
        `Average match /w album match: ${averageMatch}`
      );
    }

    // Skip results with time match lower than 25%
    if (timeMatch < 25) {
      mathingLogger(
        song.songId,
        result.songId,
        "Skipping result due to time match lower than 25%"
      );
      continue;
    }

    // If the time match is lower than 50%
    // and the average match is lower than 75%
    // we skip the result
    if (timeMatch < 50 && averageMatch < 75) {
      mathingLogger(
        song.songId,
        result.songId,
        "Skipping result due to time match < 50% and average match < 75%"
      );
      continue;
    }

    if (
      (!result.isrcSearch && averageMatch <= 85) ||
      result.source === "slider.kz" ||
      timeMatch < 0
    ) {
      // Don't add time to avg match if average match is not the best
      // (lower than 85%), always include time match if result is from
      // slider.kz or if time match is lower than 0
      averageMatch = (averageMatch + timeMatch) / 2;
    }

    averageMatch = Math.min(averageMatch, 100);
    mathingLogger(
      song.songId,
      result.songId,
      `Final average match: ${averageMatch}`
    );

    linksWithMatchValue[averageMatch] = result;
  }

  return linksWithMatchValue;
};

export const getBestResult = (
  results: Record<number, SongResult>
): [number, SongResult] => {
  const bestResults = getBestMatches(results, 8);

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
    const views: number[] = [];

    for (const [score, result] of bestResults) {
      views.push(+(result.views! ?? 0));
    }

    const highestViews = Math.max(...views);
    const lowestViews = Math.min(...views);

    if (highestViews === 0 || highestViews === lowestViews) {
      return [bestResult[0], bestResult[1]];
    }

    const weightedResults: [number, SongResult][] = [];

    for (const [score, result] of bestResults) {
      const resultViews = views[bestResults.indexOf([score, result])];
      const viewsScore =
        ((resultViews - lowestViews) / (highestViews - lowestViews)) * 15;
      const calculatedScore = Math.min(score + viewsScore, 100);
      weightedResults.push([calculatedScore, result]);
    }

    // Now we return the result with the highest score
    return weightedResults.reduce((prev, curr) =>
      prev[1] > curr[1] ? prev : curr
    );
  }

  return [bestResult[0], bestResult[1]];
};

export const getBestMatches = (
  results: Record<number, SongResult>,
  scoreThreshold: number
): [number, SongResult][] => {
  const resultItems = Object.entries(results);
  const sortedResults = resultItems.sort(([a], [b]) => Number(b) - Number(a));

  const bestScore = sortedResults[0][0];

  return sortedResults
    .filter(([score]) => Number(bestScore) - Number(score) <= scoreThreshold)
    .map(([score, result]) => [Number(score), result]);
};

const calcTimeMatch = (song: Song, result: SongResult): number => {
  const timeDiff = Math.abs(song.duration - result.duration);
  const score = Math.exp(-0.1 * timeDiff);
  return score * 100;
};

const calcAlbumMatch = (song: Song, result: SongResult): number => {
  if (!result.album) {
    return 0.0;
  }

  return Formatter.ratio(
    Formatter.slugify(song.album),
    Formatter.slugify(result.album)
  );
};

const checkForbiddenWords = (
  song: Song,
  result: SongResult
): [boolean, string[]] => {
  const songName = Formatter.slugify(song.name).replace(/-/g, "");
  const toCheck = Formatter.slugify(result.name).replace(/-/g, "");

  const words: string[] = [];

  for (const word of FORBIDDEN_WORDS) {
    if (toCheck.includes(word) && !songName.includes(word)) {
      words.push(word);
    }
  }

  return [words.length > 0, words];
};

const calcNameMatch = (
  song: Song,
  result: SongResult,
  searchQuery?: string
): number => {
  // Create match strings that will be used
  // to calculate name match value
  const [matchStr1, matchStr2] = createMatchStrings(song, result, searchQuery);
  const resultName = Formatter.slugify(result.name);
  const songName = Formatter.slugify(song.name);

  const [resList, songList] = Formatter.basedSort(
    resultName.split("-"),
    songName.split("-")
  );
  const sortedResultName = resList.join("-");
  const sortedSongName = songList.join("-");

  // Calculate initial name match
  let nameMatch = Formatter.ratio(sortedResultName, sortedSongName);

  mathingLogger(
    `${song.songId} ${result.songId} MATCH STRINGS: ${matchStr1} - ${matchStr2}`
  );
  mathingLogger(
    `${song.songId} ${result.songId} SLUG MATCH STRINGS: ${sortedSongName} - ${sortedResultName}`
  );
  mathingLogger(
    `${song.songId} ${result.songId} First name match: ${nameMatch}`
  );

  // If name match is lower than 60%,
  // we try to match using the test strings
  if (nameMatch <= 75) {
    const secondNameMatch = Formatter.ratio(matchStr1, matchStr2);

    mathingLogger(
      `${song.songId} ${result.songId} Second name match: ${secondNameMatch}`
    );

    nameMatch = Math.max(nameMatch, secondNameMatch);
  }

  return nameMatch;
};

const artistsMatchFixup1 = (
  song: Song,
  result: SongResult,
  score: number
): number => {
  // If we have a verified result, we don't have to fix anything
  if (result.verified || score > 50) {
    return score;
  }

  // If we didn't find any artist match,
  // we fallback to channel name match
  const channelNameMatch = Formatter.ratio(
    Formatter.slugify(song.artist),
    Formatter.slugify(result.artists ? result.artists.join(", ") : "")
  );

  score = Math.max(score, channelNameMatch);

  // If artist match is still too low,
  // we fallback to matching all song artist names
  // with the result's title
  if (score <= 70) {
    let artistTitleMatch = 0.0;
    const resultName = Formatter.slugify(result.name).replace("-", "");

    for (const artist of song.artists) {
      const slugArtist = Formatter.slugify(artist).replace("-", "");

      if (resultName.includes(slugArtist)) {
        artistTitleMatch += 1.0;
      }
    }

    artistTitleMatch = (artistTitleMatch / song.artists.length) * 100;

    score = Math.max(score, artistTitleMatch);
  }

  return score;
};

const artistsMatchFixup2 = (
  song: Song,
  result: SongResult,
  score: number,
  searchQuery?: string
): number => {
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
    const slugArtist = Formatter.slugify(artist).replace("-", "");

    if (matchStr2.replace("-", "").includes(slugArtist)) {
      score += 5;
    }
  }

  // if the artist match is still too low,
  // we fallback to matching all song artist names
  // with the result's artists
  if (score <= 70) {
    // Artists from song/result name without the song/result name words
    const artistList1 = Formatter.createCleanString(
      song.artists,
      Formatter.slugify(song.name),
      true
    );
    const artistList2 = Formatter.createCleanString(
      result.artists ?? [result.artist ?? ""],
      Formatter.slugify(result.name),
      true
    );

    const artistTitleMatch = Formatter.ratio(artistList1, artistList2);

    score = Math.max(score, artistTitleMatch);
  }

  return score;
};

const artistsMatchFixup3 = (
  song: Song,
  result: SongResult,
  score: number
): number => {
  if (
    score > 70 ||
    !result.artists ||
    result.artists.length !== 1 ||
    song.artists.length === 1
  ) {
    // Don't fixup the score
    // if the score is already high
    // or if the result has more than one artist
    // or if the song has only one artist
    return score;
  }

  const artistsScoreFixup = Formatter.ratio(
    Formatter.slugify(result.name),
    Formatter.slugify(Formatter.createSongTitle(song.name, [song.artist]))
  );

  if (artistsScoreFixup >= 80) {
    score = (score + artistsScoreFixup) / 2;
  }

  // Make sure that the score is not higher than 100
  score = Math.min(score, 100);

  return score;
};

const calcArtistsMatch = (song: Song, result: SongResult): number => {
  let artistMatchNumber = 0.0;

  // Result has only one artist, return 0.0
  if (
    song.artists.length === 1 ||
    !result.artists ||
    result.artists.length === 0
  ) {
    return artistMatchNumber;
  }

  const [artist1List, artist2List] = Formatter.basedSort(
    song.artists.map(Formatter.slugify),
    result.artists.map(Formatter.slugify)
  );

  // Remove main artist from the lists
  const trimmedArtist1List = artist1List.slice(1);
  const trimmedArtist2List = artist2List.slice(1);

  let artistsMatch = 0.0;
  const maxLength = Math.max(
    trimmedArtist1List.length,
    trimmedArtist2List.length
  );
  for (let i = 0; i < maxLength; i++) {
    const artist1 = trimmedArtist1List[i];
    const artist2 = trimmedArtist2List[i];
    const artist12Match = Formatter.ratio(artist1 || "", artist2 || "");
    artistsMatch += artist12Match;
  }

  artistMatchNumber = artistsMatch / trimmedArtist1List.length;

  return artistMatchNumber;
};

const calcMainArtistMatch = (song: Song, result: SongResult): number => {
  let mainArtistMatch = 0.0;

  // Verifica se result.artists está vazio
  if (!result.artists || result.artists.length === 0) {
    return mainArtistMatch;
  }

  const songArtists = song.artists.map((artist: string) =>
    Formatter.slugify(artist)
  );
  const resultArtists = result.artists.map((artist: string) =>
    Formatter.slugify(artist)
  );

  const [sortedSongArtists, sortedResultArtists] = Formatter.basedSort(
    songArtists,
    resultArtists
  );

  mathingLogger(
    `${song.songId} ${result.songId} Song artists: ${JSON.stringify(
      sortedSongArtists
    )}`
  );
  mathingLogger(
    `${song.songId} ${result.songId} Result artists: ${JSON.stringify(
      sortedResultArtists
    )}`
  );

  const slugSongMainArtist = Formatter.slugify(song.artists[0]);
  const slugResultMainArtist = sortedResultArtists[0];

  // Result has only one artist, but song has multiple artists
  // we can assume that other artists are in the main artist name
  if (song.artists.length > 1 && result.artists.length === 1) {
    for (const artist of song.artists.slice(1)) {
      const slugifiedArtist = Formatter.slugify(artist);
      const sortedArtist = Formatter.sortString(
        slugifiedArtist.split("-"),
        "-"
      );
      const sortedResultMainArtist = Formatter.sortString(
        slugResultMainArtist.split("-"),
        "-"
      );

      if (sortedResultMainArtist.includes(sortedArtist)) {
        mainArtistMatch += 100 / song.artists.length;
      }
    }

    return mainArtistMatch;
  }

  // Match main result artist with main song artist
  mainArtistMatch = Formatter.ratio(slugSongMainArtist, slugResultMainArtist);

  mathingLogger(
    `${song.songId} ${result.songId} First main artist match: ${mainArtistMatch}`
  );

  // Use second artist from the sorted list to
  // calculate the match if the first artist match is too low
  if (mainArtistMatch < 50 && songArtists.length > 1) {
    for (let index = 0; index < 2; index++) {
      const newArtistMatch = Formatter.ratio(
        songArtists[index],
        sortedResultArtists[index]
      );
      mathingLogger(
        `${song.songId} ${result.songId} Matched ${songArtists[index]} with ${sortedResultArtists[index]}: ${newArtistMatch}`
      );

      mainArtistMatch = Math.max(mainArtistMatch, newArtistMatch);
    }
  }

  return mainArtistMatch;
};

const createMatchStrings = (
  song: Song,
  result: SongResult,
  searchQuery?: string
): [string, string] => {
  const slugSongName = Formatter.slugify(song.name);
  const slugSongTitle = Formatter.slugify(
    Formatter.createSongTitle(song.name, song.artists) ||
      (searchQuery
        ? Formatter.createSearchQuery(song, searchQuery, false, null, true)
        : "")
  );

  let testStr1 = Formatter.slugify(result.name);
  let testStr2 = result.verified ? slugSongName : slugSongTitle;

  testStr1 = Formatter.fillString(song.artists, testStr1, testStr2);
  testStr2 = Formatter.fillString(song.artists, testStr2, testStr1);

  const [testList1, testList2] = Formatter.basedSort(
    testStr1.split("-"),
    testStr2.split("-")
  );
  testStr1 = testList1.join("-");
  testStr2 = testList2.join("-");

  return [testStr1, testStr2];
};

const checkCommonWord = (song: Song, result: SongResult): boolean => {
  const sentenceWords: string[] = Formatter.slugify(song.name).split("-");
  const toCheck: string = Formatter.slugify(result.name).replace("-", "");

  for (const word of sentenceWords) {
    if (word !== "" && toCheck.includes(word)) {
      return true;
    }
  }

  return false;
};
