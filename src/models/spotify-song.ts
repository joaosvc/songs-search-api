import { SimplifiedTrack, Track } from "@spotify/web-api-ts-sdk";
import { SearchResultMetadata, Song } from "../@types/types";
import Spotify from "../providers/audio/spotify";
import Formatter from "../utils/formatter";

export class SpotifySongError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifySongError";
  }
}

export default class SpotifySong {
  public static async fromUrl(url: string): Promise<SearchResultMetadata> {
    if (!url.includes("open.spotify.com") || !url.includes("track")) {
      throw new SpotifySongError(`Invalid URL: ${url}`);
    }

    const rawTrackMeta = await Spotify.getTrack(url);

    if (
      !rawTrackMeta ||
      rawTrackMeta.duration_ms === 0 ||
      rawTrackMeta.name.trim() === ""
    ) {
      throw new SpotifySongError(`Track no longer exists: ${url}`);
    }

    return this.buildSearchResultMetadata(
      SpotifySong.songFromTrackMeta(rawTrackMeta)
    );
  }

  public static async fromSearchTerm(
    searchTerm: string
  ): Promise<SearchResultMetadata> {
    const rawSearchResults = await Spotify.search(searchTerm);

    if (rawSearchResults.tracks === undefined) {
      throw new SpotifySongError(`No tracks results found for: ${searchTerm}`);
    }

    if (rawSearchResults.tracks?.items.length === 0) {
      throw new SpotifySongError(`No results found for: ${searchTerm}`);
    }

    const rawTrackMeta = rawSearchResults.tracks.items[0];

    return this.buildSearchResultMetadata(
      SpotifySong.songFromTrackMeta(rawTrackMeta)
    );
  }

  public static buildSearchResultMetadata(song?: Song): SearchResultMetadata {
    return {
      songs: song ? [song] : [],
      hasMore: false,
      nextId: null,
      nextOffset: null,
      offset: 0,
      limit: 1,
    };
  }

  public static songFromTrackMeta(rawTrackMeta: Track, args: any = {}): Song {
    const image = Formatter.getMaxImageUrl(rawTrackMeta.album.images)!;

    return {
      name: rawTrackMeta.name,
      image: image,
      url: rawTrackMeta.external_urls.spotify,
      songId: rawTrackMeta.id,
      album: rawTrackMeta.album.name,
      artist: rawTrackMeta.artists[0].name,
      artists: rawTrackMeta.artists.map((artist) => artist.name),
      isrc: rawTrackMeta.external_ids ? rawTrackMeta.external_ids.isrc : null,
      duration: Math.floor(rawTrackMeta.duration_ms / 1000),
      ...args,
    };
  }

  public static songFromSimplifiedTrackMeta(
    rawTrackMeta: SimplifiedTrack,
    args: any = {}
  ): Song {
    return {
      name: rawTrackMeta.name,
      url: rawTrackMeta.external_urls.spotify,
      songId: rawTrackMeta.id,
      album: rawTrackMeta.name,
      artist: rawTrackMeta.artists[0].name,
      artists: rawTrackMeta.artists.map((artist) => artist.name),
      duration: Math.floor(rawTrackMeta.duration_ms / 1000),
      isrc: null,
      image: "",
      ...args,
    };
  }
}
