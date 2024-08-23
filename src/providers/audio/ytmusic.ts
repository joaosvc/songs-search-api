import YTMusicService, {
  SongDetailed,
  SongFull,
  VideoDetailed,
} from "ytmusic-api";

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
      const results = await this.instance.searchSongs("a");

      return results.length > 0;
    } catch (error: any) {
      console.error("Error validating connection to YouTube", error.message);
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
    } catch (error: any) {
      console.error("Error searching in YouTube", error.message);
      return [];
    }
  }

  public static async searchSongs(searchTerm: string): Promise<SongDetailed[]> {
    try {
      await this.initialize();

      const searchResults = await this.instance.searchSongs(searchTerm);

      return searchResults;
    } catch (error: any) {
      console.error("Error searching songs in YouTube", error.message);
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
    } catch (error: any) {
      console.error("Error searching videos in YouTube", error.message);
      return [];
    }
  }

  public static async getSong(videoId: string): Promise<SongFull | null> {
    try {
      await this.initialize();

      const song = await this.instance.getSong(videoId);

      return song;
    } catch (error: any) {
      console.error("Error rettriving song YouTube:", error.message);
      return null;
    }
  }

  public static async getVideo(videoId: string): Promise<VideoDetailed | null> {
    try {
      await this.initialize();

      const video = await this.instance.getVideo(videoId);

      return video;
    } catch (error: any) {
      console.error("Error rettriving video from YouTube", error.message);
      return null;
    }
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
