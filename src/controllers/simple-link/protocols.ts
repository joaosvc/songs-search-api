export interface GetSimpleLinkParams {
  name: string;
  album: string;
  songId: string;
  url: string;
  artist: string;
  artists: string[];
  isrc: string | null;
  duration: number;
}
