import { MaxInt } from "@spotify/web-api-ts-sdk";
import { SearchResultMetadata, Song } from "../@types/types";
import Spotify from "../providers/audio/spotify";
import SpotifySong from "./spotify-song";
import Formatter from "../utils/formatter";

export class SpotifyAlbumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyAlbumError";
  }
}

export default class SpotifyAlbum {
  public static async fromUrl(
    url: string,
    offset?: number,
    limit?: number
  ): Promise<SearchResultMetadata> {
    const rawRequestLimit = (limit ? Math.min(limit, 50) : limit) as
      | MaxInt<50>
      | undefined;

    const [rawAlbumMeta, rawAlbumTracks] = await Promise.all([
      Spotify.getAlbum(url),
      Spotify.instance.albums.tracks(
        Spotify.getIdFromUrl(url)!,
        undefined,
        rawRequestLimit,
        offset
      ),
    ]);

    const songs: Song[] = [];

    for (const rawSimpliedTrackMeta of rawAlbumTracks.items) {
      if (!rawSimpliedTrackMeta || rawSimpliedTrackMeta.is_local) {
        continue;
      }

      songs.push(
        SpotifySong.songFromSimplifiedTrackMeta(rawSimpliedTrackMeta, {
          album: rawAlbumMeta.name,
          image: Formatter.getMaxImageUrl(rawAlbumMeta.images)!,
        })
      );
    }

    // await Promise.all(
    //   rawAlbumTracks.items
    //     .filter((rawTrackMeta) => rawTrackMeta && !rawTrackMeta.is_local)
    //     .map(async (rawTrackMeta) => {
    //       const newRawTrackMeta = await Spotify.getTrack(rawTrackMeta.id);

    //       songs.push(
    //         SpotifySong.songFromTrackMeta(newRawTrackMeta, {
    //           album: rawAlbumMeta.name,
    //         })
    //       );
    //     })
    // );

    const rawNextAlbumId = Spotify.getIdFromUrl(rawAlbumTracks.next);
    const rawNextAlbumOffset = rawAlbumTracks.next
      ? rawAlbumTracks.offset + rawAlbumTracks.limit
      : null;

    return {
      songs: songs,
      hasMore: !!rawAlbumTracks.next,
      nextId: rawNextAlbumId,
      nextOffset: rawNextAlbumOffset,
      offset: rawAlbumTracks.offset,
      limit: rawAlbumTracks.limit,
    };
  }
}
