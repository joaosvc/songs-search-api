import YTMusicService from "../../services/ytmusic/ytmusic-service";
import { SongDetailed, SongFull } from "../../services/ytmusic/@types/types";
import { YoutubeSong } from "../../@types/types";
import Formatter from "../../utils/search/formatter";

export class YoutubeMusicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YoutubeMusicError";
  }
}

export default class YoutubeMusic {
  public static instance: YTMusicService = {} as YTMusicService;

  public static async initialize() {
    if (!(this.instance instanceof YTMusicService)) {
      try {
        this.instance = new YTMusicService();
        await this.instance.initialize();
      } catch (error: any) {
        console.error("Error initializing YouTube", error.message);
      }
    }
  }

  public static async validateConnection(): Promise<boolean> {
    try {
      await this.initialize();
      const results = await this.searchSongs("a");

      return results.length > 0;
    } catch (error: any) {
      console.error("Error validating connection to YouTube", error.message);
      return false;
    }
  }

  public static async searchSongs(searchTerm: string): Promise<YoutubeSong[]> {
    try {
      await this.initialize();
      const searchResults = await this.instance.searchSongs(searchTerm);

      return searchResults.map((result) => {
        return this.buildResultFrom(result);
      });
    } catch (error: any) {
      console.error("Error searching songs in YouTube", error.message);
      return [];
    }
  }

  public static async searchVideos(searchTerm: string): Promise<YoutubeSong[]> {
    return this.searchSongs(searchTerm);
  }

  public static async getSong(videoId: string): Promise<YoutubeSong | null> {
    try {
      await this.initialize();

      const searchResults = await this.instance.getSong(videoId);

      return this.buildResultFrom(searchResults);
    } catch (error: any) {
      console.error("Error rettriving song YouTube:", error.message);
      return null;
    }
  }

  public static buildResultFrom(result: SongFull | SongDetailed): YoutubeSong {
    const thumbnails = Formatter.getMaxImageUrl(result.thumbnails)!;
    const url = `https://${
      result.type === "SONG" ? "music" : "www"
    }.youtube.com/watch?v=${result.videoId}`;

    console.log(result);

    return {
      name: result.name,
      videoId: result.videoId,
      artist: {
        name: result.artist.name,
      },
      artists: [
        {
          name: result.artist.name,
        },
      ],
      album: (result as any).album?.name ?? result.name,
      duration: +result.duration!,
      views: +(result as any).views,
      url: url,
      thumbnail: thumbnails,
      verified: result.type === "SONG",
    };
  }

  public static async getVideo(videoId: string): Promise<YoutubeSong | null> {
    return this.getSong(videoId);
  }

  public static getWatchId(url: string): string | null {
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^?&"'>]+)/
    );
    return match?.[1] ?? null;
  }

  public static isValidUrl(url: string): boolean {
    return this.getWatchId(url) !== null;
  }
}
