import { YoutubeSong } from "../../@types/types";
import Formatter from "../../utils/search/formatter";
import axios from "axios";

export class YoutubeMusicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YoutubeMusicError";
  }
}

export default class YoutubeMusic {
  private static API_KEY = process.env.YOUTUBE_API_KEY;
  private static BASE_URL = "https://www.googleapis.com/youtube/v3";

  public static async initialize() {
    this.API_KEY = process.env.YOUTUBE_API_KEY;

    if (!this.API_KEY) {
      throw new YoutubeMusicError("YouTube API key is not defined");
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

      const response = await axios.get(`${this.BASE_URL}/search`, {
        params: {
          part: "snippet",
          q: searchTerm,
          key: this.API_KEY,
          type: "video",
          videoCategoryId: "10",
        },
      });

      const searchResults = response.data.items;
      return searchResults.map((item: any) => this.buildResultFrom(item));
    } catch (error: any) {
      console.error("Error searching songs in YouTube", error.message);
      return [];
    }
  }

  public static async getSong(videoId: string): Promise<YoutubeSong | null> {
    try {
      await this.initialize();

      const response = await axios.get(`${this.BASE_URL}/videos`, {
        params: {
          part: "snippet,contentDetails,statistics",
          id: videoId,
          key: this.API_KEY,
        },
      });

      const videoDetails = response.data.items[0];

      if (!videoDetails) {
        throw new YoutubeMusicError("Song not found");
      }

      return this.buildResultFrom(videoDetails);
    } catch (error: any) {
      console.error("Error retrieving song from YouTube:", error.message);
      return null;
    }
  }

  public static buildResultFrom(result: any): YoutubeSong {
    const thumbnails = Formatter.getMaxImageUrl(result.snippet.thumbnails)!;
    const url = `https://www.youtube.com/watch?v=${
      result.id.videoId || result.id
    }`;

    return {
      name: result.snippet.title,
      videoId: result.id.videoId || result.id,
      artist: {
        name: result.snippet.channelTitle,
      },
      artists: [
        {
          name: result.snippet.channelTitle,
        },
      ],
      album: result.snippet.title,
      duration: YoutubeMusic.parseYouTubeDuration(
        result.contentDetails?.duration || "PT0S"
      ),
      views: result.statistics ? +result.statistics.viewCount : 0,
      url: url,
      thumbnail: thumbnails,
      verified: true,
    };
  }

  public static async searchVideos(searchTerm: string): Promise<YoutubeSong[]> {
    return this.searchSongs(searchTerm);
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

  public static parseYouTubeDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

    if (!match) {
      return 0;
    }

    const hours = parseInt(match[1]?.replace("H", "") || "0");
    const minutes = parseInt(match[2]?.replace("M", "") || "0");
    const seconds = parseInt(match[3]?.replace("S", "") || "0");

    return hours * 3600 + minutes * 60 + seconds;
  }
}
