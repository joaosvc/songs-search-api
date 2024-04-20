import {
  Album,
  Artist,
  ItemTypes,
  MaxInt,
  Playlist,
  SearchResults,
  SpotifyApi,
  Track,
  TrackItem,
} from "@spotify/web-api-ts-sdk";

export class SpotifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyError";
  }
}

export default class Spotify {
  public static instance: SpotifyApi = {} as SpotifyApi;

  public static async initialize(
    clientId: string,
    clientSecret: string
  ): Promise<void> {
    if (!(this.instance instanceof SpotifyApi)) {
      try {
        this.instance = SpotifyApi.withClientCredentials(
          clientId,
          clientSecret,
          ["user-library-read", "user-follow-read", "playlist-read-private"]
        );
      } catch (error) {
        console.error("Error initializing Spotify", error);
      }
    }
  }

  public static async validateConnection(): Promise<boolean> {
    try {
      if (!(this.instance instanceof SpotifyApi)) {
        throw new SpotifyError("Spotify client not initialized");
      }

      const results = await this.instance.search("a", ["track"], undefined, 1);

      return results.tracks?.total > 0;
    } catch (error) {
      console.error("Error validating connection to YouTubeMusic", error);
      return false;
    }
  }

  public static async search(
    searchTerm: string,
    type: ItemTypes[] = ["track"],
    limit?: MaxInt<50>
  ): Promise<SearchResults<ItemTypes[]>> {
    try {
      return await this.instance.search(searchTerm, type, undefined, limit);
    } catch (error) {
      throw new SpotifyError(
        "Couldn't get search results, check your search term"
      );
    }
  }

  public static async getAlbum(url: string): Promise<Album> {
    try {
      return await Spotify.instance.albums.get(this.getIdFromUrl(url)!);
    } catch (error) {
      throw new SpotifyError(
        "Couldn't get metadata, check if you have passed correct album id"
      );
    }
  }

  public static async getTrack(url: string): Promise<Track> {
    try {
      return await Spotify.instance.tracks.get(this.getIdFromUrl(url)!);
    } catch (error) {
      throw new SpotifyError(
        "Couldn't get metadata, check if you have passed correct track id"
      );
    }
  }

  public static async getArtist(url: string): Promise<Artist> {
    try {
      return await Spotify.instance.artists.get(this.getIdFromUrl(url)!);
    } catch (error) {
      throw new SpotifyError(
        "Couldn't get metadata, check if you have passed correct artist id"
      );
    }
  }

  public static async getPlaylist(url: string): Promise<Playlist<TrackItem>> {
    try {
      return await Spotify.instance.playlists.getPlaylist(
        this.getIdFromUrl(url)!
      );
    } catch (error) {
      throw new SpotifyError(
        "Couldn't get metadata, check if you have passed correct playlist id"
      );
    }
  }

  public static getIdFromUrl(url: string | null): string | null {
    if (!url?.includes("spotify.com")) {
      return url;
    }
    const regex =
      /(?:spotify\.com\/(?:artist|album|playlist|track)\/|playlists\/|albums\/|artists\/)(\w+)/;
    const match = url.match(regex);

    return match ? match[1] : null;
  }
}
