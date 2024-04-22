import {
  SEARCH_OPTIONS_TYPE,
  SimpleLinkMetadata,
  Song,
  SongResult,
} from "../@types/types";
import {
  getBestResult,
  mathingLogger,
  orderResults,
} from "../utils/search/mathing";
import { ISRC_REGEX, SEARCH_OPTIONS } from "../utils/search/search-options";
import YoutubeMusic from "../providers/audio/ytmusic";
import Formatter from "../utils/search/formatter";
import { GetSimpleLinkParams } from "../controllers/simple-link/protocols";
import { SongDetailed, VideoDetailed } from "../services/ytmusic/@types/types";

export default class YoutubeSearch {
  public static async fromParams(
    params: GetSimpleLinkParams
  ): Promise<SimpleLinkMetadata> {
    const song: Song = params as Song;

    try {
      const youtubeUrl = await this.search(song);

      return {
        success: true,
        message: "Simple link generated successfully",
        link: youtubeUrl,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error generating simple link, ${error.message}`,
        link: null,
      };
    }
  }

  public static async search(
    song: Song,
    onlyVerified: boolean = false,
    filterResults: boolean = true
  ): Promise<string | null> {
    let youtubeUrl = null;

    const searchQuery = Formatter.createSongTitle(
      song.name,
      song.artists
    ).toLowerCase();

    // It is not necessary to process the url
    // Reason? what we are looking for is the youtube url
    if (!song.url.includes("youtube.com/watch?v")) {
      let isrcResultsUrl: string[] = [];

      if (song.isrc) {
        const isrcResults: SongResult[] = (
          await this.getResults(song.isrc, SEARCH_OPTIONS[0])
        ).filter((songResult) => !onlyVerified || songResult.verified);

        const sortedIsrcResults = orderResults(isrcResults, song);

        isrcResultsUrl = isrcResults.map((result) => result.url);

        mathingLogger(
          `[${song.songId}] Found ${isrcResults.length} results for ISRC ${song.isrc}`
        );

        if (isrcResults.length > 0) {
          const bestIsrcResults = Object.entries(sortedIsrcResults)
            .filter(([score]) => Number(score) >= 80)
            .sort((a, b) => Number(b[0]) - Number(a[0]));

          mathingLogger(
            `[${song.songId}] Filtered to ${bestIsrcResults.length} ISRC results`
          );

          if (bestIsrcResults.length > 0) {
            const [score, bestIsrc] = bestIsrcResults[0];

            mathingLogger(
              `[${song.songId}] Best ISRC result is ${bestIsrc.url} with score ${score}`
            );

            youtubeUrl = bestIsrc.url;
          }
        }
      }

      if (youtubeUrl === null) {
        let results: Record<number, SongResult> = {};

        await Promise.all(
          SEARCH_OPTIONS.map(async (options) => {
            const searchResults = (
              await this.getResults(searchQuery, options)
            ).filter((songResult) => !onlyVerified || songResult.verified);

            mathingLogger(
              `[${song.songId}] Found ${searchResults.length} results for search query ${searchQuery} with filter: ${options.filter}, limit: ${options.limit}`
            );

            const isrcResult = searchResults.find((result) =>
              isrcResultsUrl.includes(result.url)
            );

            if (isrcResult) {
              mathingLogger(
                `[${song.songId}] Best ISRC result is ${isrcResult.url}`
              );

              youtubeUrl = isrcResult.url;
            } else {
              mathingLogger(
                `[${song.songId}] Have to filter results: ${filterResults}`
              );

              let newResults: Record<number, SongResult> = {};

              if (filterResults) {
                newResults = orderResults(searchResults, song);
              } else {
                if (searchResults.length > 0) {
                  newResults[100] = searchResults[0];
                }
              }
              const newResultsKeys = Object.keys(newResults);

              mathingLogger(
                `[${song.songId}] Filtered to ${newResultsKeys.length} results`
              );

              if (newResultsKeys.length !== 0) {
                const [bestScore, bestResult] = getBestResult(newResults);
                mathingLogger(
                  `[${song.songId}] Best result is ${bestResult.url} with score ${bestScore}`
                );

                if (bestScore >= 80 && bestResult.verified) {
                  mathingLogger(
                    "[%s] Returning verified best result %s with score %s",
                    song.songId,
                    bestResult.url,
                    bestScore
                  );

                  youtubeUrl = bestResult.url;
                } else {
                  results = { ...results, ...newResults };
                }
              }
            }
          })
        );

        if (youtubeUrl === null) {
          if (Object.keys(results).length > 0) {
            const [bestScore, bestResult] = getBestResult(results);

            mathingLogger(
              `[${song.songId}] Returning best result ${bestResult.url} with score ${bestScore}`
            );

            youtubeUrl = bestResult.url;
          } else {
            mathingLogger(`[${song.songId}] No results found`);
          }
        }
      }
    } else {
      youtubeUrl = song.url;
    }

    return youtubeUrl;
  }

  public static async getResults(
    searchTerm: string,
    options: SEARCH_OPTIONS_TYPE
  ): Promise<SongResult[]> {
    let searchResults: SongDetailed[] | VideoDetailed[] = [];

    try {
      if (options.filter === "songs") {
        searchResults = await YoutubeMusic.searchSongs(searchTerm);
      } else if (options.filter === "videos") {
        searchResults = await YoutubeMusic.searchVideos(searchTerm);
      } else {
        searchResults = await YoutubeMusic.search(searchTerm);
      }
    } catch (error) {
      console.error(
        `Error rettriving YouTubeMusic result as options ${JSON.stringify(
          options
        )}:`,
        error
      );
    }

    if (searchResults.length > options.limit) {
      searchResults = searchResults.slice(0, options.limit);
    }

    return searchResults.map((result) => {
      const isrcResult: RegExpMatchArray | null = searchTerm.match(ISRC_REGEX);
      const artists = result.artists.map((artist) => artist.name);

      return {
        source: "YoutubeMusic",
        name: result.name,
        url: `https://${
          result.type === "SONG" ? "music" : "www"
        }.youtube.com/watch?v=${result.videoId}`,
        songId: result.videoId,
        album: (result as SongDetailed).album?.name ?? "",
        verified: result.type === "SONG",
        artist: result.artist.name,
        artists: artists,
        isrcSearch: isrcResult != null,
        searchQuery: searchTerm,
        explicit: null,
        duration: +result.duration!,
        views: +result.views!,
      };
    });
  }
}
