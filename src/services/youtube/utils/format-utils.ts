import { between } from "../../../utils/between";
import { VideoFormat } from "../@types/types";
import { FORMATS } from "./formats";

const videoEncodingRanks: string[] = [
  "mp4v",
  "avc1",
  "Sorenson H.283",
  "MPEG-4 Visual",
  "VP8",
  "VP9",
  "H.264",
];

const audioEncodingRanks: string[] = [
  "mp4a",
  "mp3",
  "vorbis",
  "aac",
  "opus",
  "flac",
];

export const addFormatMeta = (format: VideoFormat) => {
  format = Object.assign({}, FORMATS[format.itag], format);
  format.hasVideo = !!format.qualityLabel;
  format.hasAudio = !!format.audioBitrate;
  format.container = format.mimeType
    ? format.mimeType.split(";")[0].split("/")[1]
    : null;
  format.codecs = format.mimeType
    ? between(format.mimeType, 'codecs="', '"')
    : null;
  format.videoCodec =
    format.hasVideo && format.codecs ? format.codecs.split(", ")[0] : null;
  format.audioCodec =
    format.hasAudio && format.codecs
      ? format.codecs.split(", ").slice(-1)[0]
      : null;
  format.isLive = /\bsource[/=]yt_live_broadcast\b/.test(format.url);
  format.isHLS = /\/manifest\/hls_(variant|playlist)\//.test(format.url);
  format.isDashMPD = /\/manifest\/dash\//.test(format.url);

  return format;
};

const getVideoBitrate = (format: VideoFormat) => format.bitrate || 0;
const getVideoEncodingRank = (format: VideoFormat) =>
  videoEncodingRanks.findIndex(
    (enc) => format.codecs && format.codecs.includes(enc)
  );
const getAudioBitrate = (format: VideoFormat) => format.audioBitrate || 0;
const getAudioEncodingRank = (format: VideoFormat) =>
  audioEncodingRanks.findIndex(
    (enc) => format.codecs && format.codecs.includes(enc)
  );

export const sortFormats = (a: VideoFormat, b: VideoFormat) =>
  sortFormatsBy(a, b, [
    // Formats with both video and audio are ranked highest.
    (format: any) => +!!format.isHLS,
    (format: any) => +!!format.isDashMPD,
    (format: any) => +(format.contentLength > 0),
    (format: any) => +(format.hasVideo && format.hasAudio),
    (format: any) => +format.hasVideo,
    (format: any) => parseInt(format.qualityLabel) || 0,
    getVideoBitrate,
    getAudioBitrate,
    getVideoEncodingRank,
    getAudioEncodingRank,
  ]);

const sortFormatsBy = (
  a: VideoFormat,
  b: VideoFormat,
  sortBy: ((format: VideoFormat) => number)[]
) => {
  let res = 0;
  for (let fn of sortBy) {
    res = fn(b) - fn(a);
    if (res !== 0) {
      break;
    }
  }
  return res;
};
