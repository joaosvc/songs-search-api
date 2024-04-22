import { ArtistBasic, VideoDetailed, VideoFull } from "../@types/types";
import checkType from "../utils/check-type";
import { isArtist, isDuration, isTitle } from "../utils/filters";
import { traverse, traverseList, traverseString } from "../utils/traverse";
import Parser from "./Parser";

export default class VideoParser {
  public static parse(data: any): VideoFull {
    return {
      type: "VIDEO",
      videoId: traverseString(data, "videoDetails", "videoId"),
      name: traverseString(data, "videoDetails", "title"),
      /**
       * What could this Parse be? How do we get into it?
       * Then we define the main artist in the list
       */
      artists: [
        {
          artistId: traverseString(data, "videoDetails", "channelId"),
          name: traverseString(data, "author"),
        },
      ],
      artist: {
        artistId: traverseString(data, "videoDetails", "channelId"),
        name: traverseString(data, "author"),
      },
      views: +traverseString(data, "videoDetails", "viewCount"),
      duration: +traverseString(data, "videoDetails", "lengthSeconds"),
      thumbnails: traverseList(data, "videoDetails", "thumbnails"),
      unlisted: traverse(data, "unlisted"),
      familySafe: traverse(data, "familySafe"),
      paid: traverse(data, "paid"),
      tags: traverseList(data, "tags"),
    };
  }

  public static parseSearchResult(item: any): VideoDetailed {
    const columns = traverseList(item, "flexColumns", "runs").flat();
    const menu = traverseList(item, "menu", "items");

    const views = columns.find(
      (obj) => obj.text.includes("views") && !obj.navigationEndpoint
    );

    const title = columns.find(isTitle);
    const artists = columns.filter(isArtist);
    const artist = columns.find(isArtist) || columns[1];
    const duration = columns.find(isDuration);

    return {
      type: "VIDEO",
      videoId: traverseString(item, "playNavigationEndpoint", "videoId"),
      playlistId: traverseString(menu, "navigationEndpoint", "playlistId"),
      params: traverseString(menu, "navigationEndpoint", "params"),
      name: traverseString(title, "text"),
      artists: artists.map((artist) => {
        return {
          name: traverseString(artist, "text"),
          artistId: traverseString(artist, "browseId") || null,
        };
      }),
      artist: {
        artistId: traverseString(artist, "browseId") || null,
        name: traverseString(artist, "text"),
      },
      views: views ? Parser.parseViews(views.text) : null,
      duration: duration ? Parser.parseDuration(duration.text) : null,
      thumbnails: traverseList(item, "thumbnails"),
    };
  }

  public static parseArtistTopVideo(
    item: any,
    artistBasic: ArtistBasic
  ): VideoDetailed {
    return {
      type: "VIDEO",
      videoId: traverseString(item, "videoId"),
      name: traverseString(item, "runs", "text"),
      artists: [artistBasic],
      artist: artistBasic,
      views: null,
      duration: null,
      thumbnails: traverseList(item, "thumbnails"),
    };
  }

  public static parsePlaylistVideo(item: any): VideoDetailed {
    const columns = traverseList(item, "flexColumns", "runs").flat();
    const menu = traverseList(item, "menu", "items");

    const views = columns.find(
      (obj) => obj.text.includes("views") && !obj.navigationEndpoint
    );

    const title = columns.find(isTitle) || columns[0];
    const artist = columns.find(isArtist) || columns[1];
    const artists = columns.filter(isArtist);
    const duration = columns.find(isDuration);

    return checkType(
      {
        type: "VIDEO",
        videoId:
          traverseString(item, "playNavigationEndpoint", "videoId") ||
          traverseList(item, "thumbnails")[0].url.match(
            /https:\/\/i\.ytimg\.com\/vi\/(.+)\//
          )?.[1],
        playlistId: traverseString(menu, "navigationEndpoint", "playlistId"),
        params: traverseString(menu, "navigationEndpoint", "params"),
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
        views: views ? Parser.parseViews(views.text) : null,
        duration: duration ? Parser.parseDuration(duration.text) : null,
        thumbnails: traverseList(item, "thumbnails"),
      },
      VideoDetailed
    );
  }
}
