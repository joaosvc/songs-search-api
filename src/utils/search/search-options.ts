import { SEARCH_OPTIONS_TYPE } from "../../@types/types";

export const ISRC_REGEX: RegExp = /^[A-Z]{2}-?\w{3}-?\d{2}-?\d{5}$/;
export const SEARCH_OPTIONS: SEARCH_OPTIONS_TYPE[] = [
  { filter: "songs", limit: 50 },
  { filter: "videos", limit: 50 },
];
