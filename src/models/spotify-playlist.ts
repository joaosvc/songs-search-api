import { MaxInt } from "@spotify/web-api-ts-sdk";
import { Song, SearchResultMetadata } from "../@types/types";
import Spotify from "../providers/audio/spotify";
import SpotifySong from "./spotify-song";

export class SpotifyPlaylistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyPlaylistError";
  }
}

export default class SpotifyPlaylist {
  public static async fromUrl(
    url: string,
    offset?: number,
    limit?: number
  ): Promise<SearchResultMetadata> {
    const rawRequestLimit = (limit ? Math.min(limit, 50) : limit) as
      | MaxInt<50>
      | undefined;
    const rawPlaylistItems = await Spotify.instance.playlists.getPlaylistItems(
      Spotify.getIdFromUrl(url)!,
      undefined,
      undefined,
      rawRequestLimit,
      offset
    );

    const songs: Song[] = (
      await Promise.all(
        rawPlaylistItems.items.map(async (track) => {
          if (
            !track ||
            !track.track ||
            track.track.is_local ||
            track.track.type !== "track"
          ) {
            return null;
          }
          return SpotifySong.songFromTrackMeta(track.track);
        })
      )
    ).filter((song): song is Song => song !== null);

    const rawNextPlaylistId = Spotify.getIdFromUrl(rawPlaylistItems.next);
    const rawNextPlaylistOffset = rawPlaylistItems.next
      ? rawPlaylistItems.offset + rawPlaylistItems.limit
      : null;

    return {
      metadata: songs,
      type: "songs",
      hasMore: !!rawPlaylistItems.next,
      nextId: rawNextPlaylistId,
      nextOffset: rawNextPlaylistOffset,
      offset: rawPlaylistItems.offset,
      limit: rawPlaylistItems.limit,
    };
  }
}
