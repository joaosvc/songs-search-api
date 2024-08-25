import { type, union } from "arktype";

export type Song = typeof Song.infer;
export const Song = type({
  name: "string",
  url: "string",
  image: "string",
  songId: "string",
  album: "string",
  artist: "string",
  artists: ["string", "[]"],
  isrc: union("string", "null"),
  duration: "number",
});

export type SongList = typeof SongList.infer;
export const SongList = type({
  songs: [Song, "[]"],
});

export type SongResult = typeof SongResult.infer;
export const SongResult = type({
  source: union('"YoutubeMusic"', '"slider.kz"'),
  name: "string",
  url: "string",
  songId: "string",
  album: "string",
  artist: "string",
  artists: ["string", "[]"],
  verified: "boolean",
  isrcSearch: "boolean",
  searchQuery: "string",
  duration: "number",
  views: "number",
});

export type SearchResultMetadata = typeof SearchResultMetadata.infer;
export const SearchResultMetadata = type({
  metadata: union([Song, "[]"], "string[]"),
  type: "string",
  offset: "number",
  limit: "number",
  hasMore: "boolean",
  nextId: union("string", "null"),
  nextOffset: union("number", "null"),
});

export type SEARCH_OPTIONS_TYPE = typeof SEARCH_OPTIONS_TYPE.infer;
export const SEARCH_OPTIONS_TYPE = type({
  filter: union('"songs"', '"videos"'),
  limit: "number",
});

export type YoutubeSearchResult = typeof YoutubeSearchResult.infer;
export const YoutubeSearchResult = type({
  name: "string",
  url: "string",
  album: "string",
  artist: "string",
  artists: ["string", "[]"],
  duration: "number",
  bestScore: "string | number | null",
});

export type SimpleLinkMetadata = typeof SimpleLinkMetadata.infer;
export const SimpleLinkMetadata = type({
  success: "boolean",
  message: "string",
  song: union(YoutubeSearchResult, "null"),
  album: union("string[]", "null"),
});

export type FullSearchResultMetadata = typeof FullSearchResultMetadata.infer;
export const FullSearchResultMetadata = type({
  metadata: "any",
  offset: "number",
  limit: "number",
  hasMore: "boolean",
  nextId: union("string", "null"),
  nextOffset: union("number", "null"),
});

export type AudioFormatsMetadata = typeof AudioFormatsMetadata.infer;
export const AudioFormatsMetadata = type({
  success: "boolean",
  message: "string",
  formats: ["unknown", "[]"],
});

export type YoutubeSong = typeof YoutubeSong.infer;
export const YoutubeSong = type({
  name: "string",
  videoId: "string",
  artist: {
    name: "string",
  },
  artists: [
    {
      name: "string",
    },
    "[]",
  ],
  url: "string",
  album: "string",
  duration: "number",
  views: "number",
  verified: "boolean",
  thumbnail: "string",
});
