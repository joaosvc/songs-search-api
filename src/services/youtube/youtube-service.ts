import { InfoOptions, RetryOptions } from "./@types/types";
import { pipeline } from "./utils/pipeline";
import { VideoInfo } from "./@types/types";
import { exposedMiniget } from "./utils/mineget";
import { findJSON, parseJSON } from "../../utils/json-parser";
import { between } from "../../utils/between";
import { decipherFormats } from "./utils/sig";
import { parser as SaxParser } from "sax";
import { addFormatMeta, sortFormats } from "./utils/format-utils";
import {
  INFO_HOST,
  INFO_PATH,
  VIDEO_EURL,
  BASE_URL,
  BASE_VERSION,
} from "./utils/utils";
import Miniget from "miniget";
import Address from "../../utils/address";
import QueryString from "querystring";
import FilterPlayerResponse from "./filter/player-response";
import YoutubeDomains from "./utils/domains";
import { YoutubeUnrecoverableError } from "./error/unrecoverable-error";
import Cache from "./utils/cache";

export default class YoutubeService {
  public static cookieCache = new Cache(1000 * 60 * 60 * 24);
  public static watchPageCache = new Cache(60000);

  public static async fromUrl(
    url: string,
    options: InfoOptions = {}
  ): Promise<VideoInfo> {
    const id = YoutubeDomains.getURLVideoID(url);

    if (options.IPv6Block) {
      options.requestOptions = Object.assign({}, options.requestOptions, {
        family: 6,
        localAddress: Address.getRandomIPv6(options.IPv6Block),
      });
    }
    const retryOptions: RetryOptions = Object.assign(
      {},
      Miniget.defaultOptions,
      options.requestOptions
    );
    options.requestOptions = Object.assign({}, options.requestOptions, {});
    options.requestOptions.headers = Object.assign(
      {},
      {
        // eslint-disable-next-line max-len
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36",
      },
      options.requestOptions.headers
    );

    let info = await pipeline([id, options], retryOptions, [
      this.getWatchHTMLPage,
      this.getWatchJSONPage,
      this.getVideoInfoPage,
    ]);

    Object.assign(info, {
      formats: FilterPlayerResponse.parseFormats(info.player_response),
    });

    const hasManifest =
      info.player_response &&
      info.player_response.streamingData &&
      (info.player_response.streamingData.dashManifestUrl ||
        info.player_response.streamingData.hlsManifestUrl);

    let funcs = [];

    if (info.formats.length) {
      info.html5player =
        info.html5player ||
        FilterPlayerResponse.getHTML5player(
          await YoutubeService.getWatchHTMLPageBody(id, options)
        ) ||
        FilterPlayerResponse.getHTML5player(
          await this.getEmbedPageBody(id, options)
        );

      if (!info.html5player) {
        throw Error("Unable to find html5player file");
      }

      const html5player = new URL(info.html5player, BASE_URL).toString();
      funcs.push(decipherFormats(info.formats, html5player, options));
    }

    if (hasManifest && info.player_response.streamingData.dashManifestUrl) {
      let url = info.player_response.streamingData.dashManifestUrl;

      funcs.push(this.getDashManifest(url, options));
    }

    if (hasManifest && info.player_response.streamingData.hlsManifestUrl) {
      let url = info.player_response.streamingData.hlsManifestUrl;

      funcs.push(this.getM3U8(url, options));
    }

    let results = await Promise.all(funcs);

    info.formats = Object.values(Object.assign({}, ...results));
    info.formats = info.formats.map(addFormatMeta);
    info.formats.sort(sortFormats);
    info.full = true;

    return info;
  }

  public static async getM3U8(url: string, options: InfoOptions) {
    const newURL = new URL(url, BASE_URL);
    const body = await exposedMiniget(newURL.toString(), options).text();
    let formats: any = {};

    body
      .split("\n")
      .filter((line) => /^https?:\/\//.test(line))
      .forEach((line) => {
        const itag = parseInt(line.match(/\/itag\/(\d+)\//)![1]);
        formats[line] = { itag, url: line };
      });
    return formats;
  }

  public static getDashManifest(url: string, options: InfoOptions) {
    return new Promise((resolve, reject) => {
      let formats: any = {};
      const parser = SaxParser(false);
      parser.onerror = reject;
      let adaptationSet: any;

      parser.onopentag = (node: any) => {
        if (node.name === "ADAPTATIONSET") {
          adaptationSet = node.attributes;
        } else if (node.name === "REPRESENTATION") {
          const itag = parseInt(node.attributes.ID);
          if (!isNaN(itag)) {
            formats[url] = Object.assign(
              {
                itag,
                url,
                bitrate: parseInt(node.attributes.BANDWIDTH),
                mimeType: `${adaptationSet.MIMETYPE}; codecs="${node.attributes.CODECS}"`,
              },
              node.attributes.HEIGHT
                ? {
                    width: parseInt(node.attributes.WIDTH),
                    height: parseInt(node.attributes.HEIGHT),
                    fps: parseInt(node.attributes.FRAMERATE),
                  }
                : {
                    audioSampleRate: node.attributes.AUDIOSAMPLINGRATE,
                  }
            );
          }
        }
      };
      parser.onend = () => {
        resolve(formats);
      };
      const req = exposedMiniget(new URL(url, BASE_URL).toString(), options);
      req.setEncoding("utf8");
      req.on("error", reject);
      req.on("data", (chunk) => {
        parser.write(chunk);
      });
      req.on("end", parser.close.bind(parser));
    });
  }

  public static getEmbedPageBody(id: string, options: InfoOptions) {
    const embedUrl = `https://www.YoutubeService.com/embed/${id}?hl=${
      options.lang || "en"
    }`;
    return exposedMiniget(embedUrl, options).text();
  }

  public static getWatchJSONURL = (id: string, options: InfoOptions) =>
    `${BASE_URL + id}&hl=${options.lang || "en"}&pbj=1`;

  public static async getWatchJSONPage(id: string, options: InfoOptions) {
    const reqOptions: any = {
      headers: { ...options.requestOptions?.headers },
    };
    const cookie: string =
      reqOptions.headers.Cookie || reqOptions.headers.cookie || "";
    reqOptions.headers = {
      "x-youtube-client-name": "1",
      "x-youtube-client-version": options.version || BASE_VERSION,
      "x-youtube-identity-token":
        this.cookieCache.get(cookie || "browser") || "",
      ...reqOptions.headers,
    };

    const setIdentityToken = async (
      key: string,
      throwIfNotFound: boolean
    ): Promise<void> => {
      if (reqOptions.headers["x-youtube-identity-token"]) return;
      reqOptions.headers["x-youtube-identity-token"] =
        await this.getIdentityToken(id, options, key, throwIfNotFound);
    };

    if (cookie) {
      await setIdentityToken(cookie, true);
    }

    const jsonUrl: string = this.getWatchJSONURL(id, options);
    const body: string = await exposedMiniget(
      jsonUrl,
      options,
      reqOptions
    ).text();
    const parsedBody: any = parseJSON("watch.json", "body", body);

    if (parsedBody.reload === "now") {
      await setIdentityToken("browser", false);
    }

    if (parsedBody.reload === "now" || !Array.isArray(parsedBody)) {
      throw new Error("Unable to retrieve video metadata in watch.json");
    }

    let info: any = parsedBody.reduce(
      (part, curr) => ({ ...curr, ...part }),
      {}
    );
    info.player_response = FilterPlayerResponse.findPlayerResponse(
      "watch.json",
      info
    );
    info.html5player =
      info.player && info.player.assets && info.player.assets.js;

    return info;
  }

  public static getWatchHTMLPageBody(id: string, options: InfoOptions) {
    const url = `${BASE_URL + id}&hl=${options.lang || "en"}`;

    return this.watchPageCache.getOrSet(url, async () => {
      return exposedMiniget(url, options).text();
    });
  }

  public static async getIdentityToken(
    id: string,
    options: InfoOptions,
    key: string,
    throwIfNotFound: boolean
  ) {
    return this.cookieCache.getOrSet(key, async () => {
      let page = await YoutubeService.getWatchHTMLPageBody(id, options);
      let match = page.match(/(["'])ID_TOKEN\1[:,]\s?"([^"]+)"/);

      if (!match && throwIfNotFound) {
        throw new YoutubeUnrecoverableError(
          "Cookie header used in request, but unable to find YouTube identity token"
        );
      }
      return match && match[2];
    });
  }

  public static async getWatchHTMLPage(
    id: string,
    options: InfoOptions
  ): Promise<any> {
    let body: string = await YoutubeService.getWatchHTMLPageBody(id, options);
    let info: any = { page: "watch" };

    try {
      info.version = between(body, '{"key":"cver","value":"', '"}');

      info.player_response = findJSON(
        "watch.html",
        "player_response",
        body,
        /\bytInitialPlayerResponse\s*=\s*\{/i,
        "</script>",
        "{"
      );
    } catch (err: any) {
      let args = findJSON(
        "watch.html",
        "player_response",
        body,
        /\bytplayer\.config\s*=\s*{/,
        "</script>",
        "{"
      );
      info.player_response = FilterPlayerResponse.findPlayerResponse(
        "watch.html",
        args
      );
    }

    info.response = findJSON(
      "watch.html",
      "response",
      body,
      /\bytInitialData("\])?\s*=\s*\{/i,
      "</script>",
      "{"
    );
    info.html5player = FilterPlayerResponse.getHTML5player(body);

    return info;
  }

  public static async getVideoInfoPage(
    id: string,
    options: InfoOptions
  ): Promise<VideoInfo> {
    const version = options.version || BASE_VERSION;

    const url = new URL(`https://${INFO_HOST}${INFO_PATH}`);
    url.searchParams.set("video_id", id);
    url.searchParams.set("c", "TVHTML5");
    url.searchParams.set("cver", `7${version.substr(1)}`);
    url.searchParams.set("eurl", VIDEO_EURL + id);
    url.searchParams.set("ps", "default");
    url.searchParams.set("gl", "US");
    url.searchParams.set("hl", options.lang || "en");
    url.searchParams.set("html5", "1");

    console.log(url.toString());
    const body: string = await exposedMiniget(url.toString(), options).text();

    let info: any = QueryString.parse(body);

    info.player_response = FilterPlayerResponse.findPlayerResponse(
      "get_video_info",
      info
    );
    return info;
  }
}
