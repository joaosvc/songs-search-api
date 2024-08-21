import {
  SearchAlbumsResultMetadata,
  SearchResultMetadata,
  Song,
} from "../../@types/types";
import SpotifyAlbum from "../../models/spotify-album";
import SpotifyArtist from "../../models/spotify-artist";
import SpotifyPlaylist from "../../models/spotify-playlist";
import SpotifySong from "../../models/spotify-song";
import YoutubeMusic from "../../providers/audio/ytmusic";
import Formatter from "./formatter";

export default class Parser {
  public static async searchSongs(
    request: string,
    offset?: number,
    limit?: number
  ): Promise<SearchResultMetadata | SearchAlbumsResultMetadata> {
    // Remove /intl-xxx/ from Spotify URLs with regex
    request = request.replace(/\/intl-\w+\//, "/");

    try {
      if (request.includes("open.spotify.com") && request.includes("track")) {
        return await SpotifySong.fromUrl(request);
      } else if (request.includes("https://spotify.link/")) {
        const fullUrl = await Parser.getFullSpotifyUrl(request);

        return await Parser.searchSongs(fullUrl);
      } else if (
        request.includes("open.spotify.com") &&
        request.includes("playlist")
      ) {
        return await SpotifyPlaylist.fromUrl(request, offset, limit);
      } else if (
        request.includes("open.spotify.com") &&
        request.includes("album")
      ) {
        return await SpotifyAlbum.fromUrl(request, offset, limit);
      } else if (
        request.includes("open.spotify.com") &&
        request.includes("artist")
      ) {
        return await SpotifyArtist.fromUrl(request, offset, limit);
      } else if (request.includes("youtube.com/watch?v")) {
        const songResult = await YoutubeMusic.getSong(
          YoutubeMusic.getWatchId(request)!
        );

        if (songResult != null) {
          /**
           * Exemple of Spotify Search Result
           *
           * SpotifySong.fromSearchTerm(`${songFull.artist.name} - ${songFull.name}`)
           */

          const image = Formatter.getMaxImageUrl(songResult.thumbnails)!;

          return SpotifySong.buildSearchResultMetadata({
            name: songResult.name,
            url: request,
            image: image,
            songId: songResult.videoId,
            album: songResult.name,
            artist: songResult.artist.name,
            artists: [songResult.artist.name],
            duration: songResult.duration,
            isrc: null,
          });
        }
      }
    } catch (error: any) {
      throw new Error("Error parsing Spotify URL: " + error.message);
    }

    return SpotifySong.buildSearchResultMetadata();
  }

  public static async searchAllSongs(request: string): Promise<Song[]> {
    let currentOffset = 0;
    let hasMore = true;
    let result: Song[] = [];
    let nextId = null;

    while (hasMore) {
      const metadata = await Parser.searchSongs(
        nextId ? nextId : request,
        currentOffset
      );

      if (hasMore && metadata.nextOffset) {
        currentOffset = metadata.nextOffset;
        nextId = metadata.nextId;
      } else {
        hasMore = false;
      }

      if ("songs" in metadata) {
        result = result.concat(metadata.songs);
      } else if ("albums" in metadata) {
        for (const album of metadata.albums) {
          const albumMetadata = await Parser.searchSongs(album);

          if ("songs" in albumMetadata) {
            result = result.concat(albumMetadata.songs);
          }
        }
      }
    }

    return result;
  }

  public static async searchPlaylistSongs(
    playlistId: string,
    offset?: number,
    limit?: number
  ): Promise<SearchResultMetadata> {
    try {
      return await SpotifyPlaylist.fromUrl(playlistId, offset, limit);
    } catch (error: any) {
      throw new Error(
        "Error rettriving next songs of playlist: " + error.message
      );
    }
  }

  public static async searchAlbumSongs(
    albumId: string,
    offset?: number,
    limit?: number
  ): Promise<SearchResultMetadata> {
    try {
      return await SpotifyAlbum.fromUrl(albumId, offset, limit);
    } catch (error: any) {
      throw new Error("Error rettriving next songs of album: " + error.message);
    }
  }

  public static async searchArtistsAlbums(
    artistId: string,
    offset?: number,
    limit?: number
  ): Promise<SearchAlbumsResultMetadata> {
    try {
      return await SpotifyArtist.fromUrl(artistId, offset, limit);
    } catch (error: any) {
      throw new Error(
        "Error rettriving next albums of artist: " + error.message
      );
    }
  }

  public static async getFullSpotifyUrl(request: string): Promise<string> {
    try {
      const response = await fetch(request, {
        method: "HEAD",
        redirect: "follow",
      });
      return response.url;
    } catch (error: any) {
      throw new Error("Error rettriving Spotify full URL: " + error.message);
    }
  }
}
