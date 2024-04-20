import Genius from "./types/genius";
import Formatter from "../../utils/formatter";
import { Song } from "../../@types/types";

export class LyricsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LyricsError";
  }
}

export interface LyricsType {
  getResults(name: string, artists: string[]): Promise<any>;
  extractLyrics(url: string): Promise<string>;
}

export class LyricsProvider {
  protected lyricsClass: { [lyrics: string]: any } = {
    genius: Genius,
  };

  protected lyrics: LyricsType[] = [];

  public constructor(lyrics: string[] = ["genius"]) {
    this.lyrics = lyrics.map((lyric) => {
      if (this.lyricsClass[lyric]) {
        return new this.lyricsClass[lyric]();
      }
      throw new LyricsError(`Lyrics provider ${lyric} not found`);
    });
  }

  public async searchLyrics(song: Song): Promise<string | null> {
    for (const provider of this.lyrics) {
      try {
        const lyrics = await this.getLyricsFromProvider(
          provider,
          song.name,
          song.artists
        );

        if (lyrics !== null) {
          return lyrics;
        }
      } catch (error) {
        console.error("Error rettring lyrics from", provider, error);
      }
    }

    return null;
  }

  public async getLyricsFromProvider(
    provider: LyricsType,
    name: string,
    artists: string[]
  ): Promise<any> {
    try {
      const results = await provider.getResults(name, artists);

      const resultsWithScore: { [key: number]: string } = {};

      for (const [title, url] of Object.entries(results)) {
        const resultTitle = Formatter.slugify(title);
        const matchTitle = Formatter.slugify(`${name} - ${artists.join(", ")}`);
        const [resList, songList] = Formatter.basedSort(
          resultTitle.split("-"),
          matchTitle.split("-")
        );
        const sortedResultTitle = resList.join("-");
        const sortedMatchTitle = songList.join("-");

        const score = Formatter.ratio(sortedResultTitle, sortedMatchTitle);

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

      return await provider.extractLyrics(resultsWithScore[highestScore]);
    } catch (error) {
      console.error("Error retrieving lyrics from provider", error);
      return null;
    }
  }
}
