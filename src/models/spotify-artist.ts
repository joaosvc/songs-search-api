import { MaxInt } from "@spotify/web-api-ts-sdk";
import Spotify from "../providers/audio/spotify";
import { SearchAlbumsResultMetadata } from "../@types/types";

export class SpotifyArtistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyArtistError";
  }
}

export default class SpotifyArtist {
  static async fromUrl(
    url: string,
    offset?: number,
    limit?: number
  ): Promise<SearchAlbumsResultMetadata> {
    const rawArtistMeta = await Spotify.getArtist(url);

    const rawRequestLimit = (limit ? Math.min(limit, 50) : limit) as
      | MaxInt<50>
      | undefined;
    const rawArtistAlbums = await Spotify.instance.artists.albums(
      rawArtistMeta.id,
      "album,single",
      undefined,
      rawRequestLimit,
      offset
    );

    const albums: string[] = await Promise.all(
      rawArtistAlbums.items.map(async (album) => album.external_urls.spotify)
    );

    const rawNextArtistId = Spotify.getIdFromUrl(rawArtistAlbums.next);
    const rawNextAlbumOffset = rawArtistAlbums.next
      ? rawArtistAlbums.offset + rawArtistAlbums.limit
      : null;

    return {
      albums: albums,
      hasMore: !!rawArtistAlbums.next,
      nextId: rawNextArtistId,
      nextOffset: rawNextAlbumOffset,
      offset: rawArtistAlbums.offset,
      limit: rawArtistAlbums.limit,
    };
  }
}
