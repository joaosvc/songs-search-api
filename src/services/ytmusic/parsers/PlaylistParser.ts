import {
  ArtistBasic,
  PlaylistDetailed,
  PlaylistFull,
  PlaylistWatch,
} from "../@types/types";
import checkType from "../utils/check-type";
import { isArtist } from "../utils/filters";
import { traverse, traverseList, traverseString } from "../utils/traverse";

export default class PlaylistParser {
  public static parse(data: any, playlistId: string): PlaylistFull {
    const artist = traverse(data, "header", "subtitle");

    return checkType(
      {
        type: "PLAYLIST",
        playlistId,
        name: traverseString(data, "header", "title", "text"),
        /**
         * What could this Parse be? How do we get into it?
         * Then we define the main artist in the list
         */
        artists: [
          {
            name: traverseString(artist, "text"),
            artistId: traverseString(artist, "browseId") || null,
          },
        ],
        artist: {
          name: traverseString(artist, "text"),
          artistId: traverseString(artist, "browseId") || null,
        },
        videoCount:
          +traverseList(data, "header", "secondSubtitle", "text")
            .at(2)
            .split(" ")
            .at(0)
            .replaceAll(",", "") ?? null,
        thumbnails: traverseList(data, "header", "thumbnails"),
      },
      PlaylistFull
    );
  }

  public static parseSearchResult(item: any): PlaylistDetailed {
    const columns = traverseList(item, "flexColumns", "runs").flat();

    // No specific way to identify the title
    const title = columns[0];
    const artist = columns.find(isArtist) || columns[3];
    const artists = columns.filter(isArtist);

    return checkType(
      {
        type: "PLAYLIST",
        playlistId: traverseString(item, "overlay", "playlistId"),
        name: traverseString(title, "text"),
        artists: artists.map((artist) => {
          return {
            name: traverseString(artist, "text"),
            artistId: traverseString(artist, "browseId") || null,
          };
        }),
        artist: {
          name: traverseString(artist, "text"),
          artistId: traverseString(artist, "browseId") || null,
        },
        thumbnails: traverseList(item, "thumbnails"),
      },
      PlaylistDetailed
    );
  }

  public static parseArtistFeaturedOn(
    item: any,
    artistBasic: ArtistBasic
  ): PlaylistDetailed {
    return checkType(
      {
        type: "PLAYLIST",
        playlistId: traverseString(item, "navigationEndpoint", "browseId"),
        name: traverseString(item, "runs", "text"),
        artists: [artistBasic],
        artist: artistBasic,
        thumbnails: traverseList(item, "thumbnails"),
      },
      PlaylistDetailed
    );
  }

  public static parseWatchPlaylist(item: any): PlaylistWatch {
    return checkType(
      {
        type: "PLAYLIST",
        playlistId: traverseString(item, "navigationEndpoint", "playlistId"),
        name: traverseString(item, "runs", "text"),
        thumbnails: traverseList(item, "thumbnails"),
      },
      PlaylistWatch
    );
  }
}
