import {
  SongDetailed,
  SongFull,
  VideoDetailed,
} from "../../services/ytmusic/@types/types";
import YTMusicService from "../../services/ytmusic/ytmusic-service";

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
      } catch (error) {
        console.error("Error initializing YoutubeMusic", error);
      }
    }
  }

  public static async validateConnection(): Promise<boolean> {
    try {
      await this.initialize();
      const results = await this.instance.searchSongs("a");

      return results.length > 0;
    } catch (error) {
      console.error("Error validating connection to YouTubeMusic", error);
      return false;
    }
  }

  public static async search(
    searchTerm: string
  ): Promise<SongDetailed[] | VideoDetailed[]> {
    try {
      await this.initialize();

      const searchResults = (await this.instance.search(searchTerm)).filter(
        (result) => result.type === "SONG" || result.type === "VIDEO"
      ) as SongDetailed[] | VideoDetailed[];

      return searchResults;
    } catch (error) {
      console.error("Error searching in YouTubeMusic", error);
      return [];
    }
  }

  public static async searchSongs(searchTerm: string): Promise<SongDetailed[]> {
    try {
      await this.initialize();

      const searchResults = await this.instance.searchSongs(searchTerm);

      return searchResults;
    } catch (error) {
      console.error("Error searching songs in YouTubeMusic", error);
      return [];
    }
  }

  public static async searchVideos(
    searchTerm: string
  ): Promise<VideoDetailed[]> {
    try {
      await this.initialize();

      const searchResults = await this.instance.searchVideos(searchTerm);

      return searchResults;
    } catch (error) {
      console.error("Error searching videos in YouTubeMusic", error);
      return [];
    }
  }

  public static async getSong(videoId: string): Promise<SongFull | null> {
    try {
      await this.initialize();

      const song = await this.instance.getSong(videoId);

      return song;
    } catch (error) {
      console.error("Error rettriving song from YouTubeMusic", error);
      return null;
    }
  }

  public static async getVideo(videoId: string): Promise<VideoDetailed | null> {
    try {
      await this.initialize();

      const video = await this.instance.getVideo(videoId);

      return video;
    } catch (error) {
      console.error("Error rettriving video from YouTubeMusic", error);
      return null;
    }
  }

  public static getWatchId(url: string): string | null {
    return url.match(/[?&]v=([^&]+)/)?.[1] ?? null;
  }
}
