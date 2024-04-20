import slugfy from "slugify";
import stringSimilarity from "string-similarity";
import { Song } from "../@types/types";

export class FormatterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormatterError";
  }
}

export default class Formatter {
  public static createSongTitle(songName: string, artists: string[]): string {
    const joinedArtists = artists.join(", ");

    if (artists.length >= 1) {
      return `${joinedArtists} - ${songName}`;
    }
    return songName;
  }

  public static sanitizeString(string: string): string {
    return (
      string
        // Disallowed characters for Windows file system
        .replace(/[\/\\:*?"<>|]/g, "")
        // Replace double quotes (")
        .replace(/"/g, "'")
        // Replace semi-colons (:)
        .replace(/:/g, "-")
    );
  }

  public static slugify(string: string): string {
    return slugfy(string, { lower: true });
  }

  public static createSearchQuery(
    song: Song,
    template: string,
    sanitize: boolean,
    fileExtension: string | null = null,
    short: boolean = false
  ): string {
    const VARS = ["{artist}", "{title}"];

    // If template does not contain any of the keys,
    // append {artist} - {title} at the beginning of the template
    if (!VARS.some((key) => template.includes(key))) {
      template = `{${song.artist}} - {${song.name}}${template}`;
    }

    return Formatter.formatQuery(
      song,
      template,
      sanitize,
      fileExtension,
      short
    );
  }

  public static formatQuery(
    song: Song,
    template: string,
    santitize: boolean,
    fileExtension: string | null = null,
    short: boolean = false
  ): string {
    if (template.includes("{output-ext}") && fileExtension === null) {
      throw new FormatterError(
        "fileExtension is null, but template contains {output-ext}"
      );
    }

    const formats: Record<string, any> = {
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
    const artists = song.artists.filter(
      (artist: string) =>
        !Formatter.slugify(artist).includes(Formatter.slugify(song.name))
    );

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

  public static sortString(strings: string[], joinStr: string): string {
    const finalStr: string[] = [...strings];
    finalStr.sort();
    return finalStr.join(joinStr);
  }

  public static basedSort(
    strings: string[],
    basedOn: string[]
  ): [string[], string[]] {
    // Sorting both input lists
    strings.sort();
    basedOn.sort();

    // Creating a map to store the index of each string in basedOn list
    const listMap: { [key: string]: number } = {};
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

  public static ratio(string1: string, string2: string): number {
    return stringSimilarity.compareTwoStrings(string1, string2) * 100;
  }

  public static fillString(
    strings: string[],
    mainString: string,
    stringToCheck: string
  ): string {
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

  public static createCleanString(
    words: string[],
    inputString: string,
    sort = false,
    joinStr = "-"
  ): string {
    const string = Formatter.slugify(inputString).replace(/-/g, "");
    const final: string[] = [];

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

  public static getMaxImageUrl(
    images: { url: string; width: number; height: number }[]
  ): string | null {
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
