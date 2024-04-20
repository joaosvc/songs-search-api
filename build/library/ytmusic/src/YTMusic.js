"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const tough_cookie_1 = require("tough-cookie");
const constants_1 = require("./constants");
const AlbumParser_1 = tslib_1.__importDefault(require("./parsers/AlbumParser"));
const ArtistParser_1 = tslib_1.__importDefault(require("./parsers/ArtistParser"));
const NextParser_1 = tslib_1.__importDefault(require("./parsers/NextParser"));
const Parser_1 = tslib_1.__importDefault(require("./parsers/Parser"));
const PlaylistParser_1 = tslib_1.__importDefault(require("./parsers/PlaylistParser"));
const SearchParser_1 = tslib_1.__importDefault(require("./parsers/SearchParser"));
const SongParser_1 = tslib_1.__importDefault(require("./parsers/SongParser"));
const VideoParser_1 = tslib_1.__importDefault(require("./parsers/VideoParser"));
const traverse_1 = require("./utils/traverse");
class YTMusic {
    /**
     * Creates an instance of YTMusic
     * Make sure to call initialize()
     */
    constructor() {
        this.cookiejar = new tough_cookie_1.CookieJar();
        this.config = {};
        this.client = axios_1.default.create({
            baseURL: "https://music.youtube.com/",
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.5",
            },
            withCredentials: true,
        });
        this.client.interceptors.request.use(req => {
            if (!req.baseURL)
                return;
            const cookieString = this.cookiejar.getCookieStringSync(req.baseURL);
            if (cookieString) {
                if (!req.headers) {
                    req.headers = {};
                }
                req.headers["Cookie"] = cookieString;
            }
            return req;
        });
        this.client.interceptors.response.use(res => {
            if ("set-cookie" in res.headers) {
                if (!res.config.baseURL)
                    return;
                const setCookie = res.headers["set-cookie"];
                for (const cookieString of [setCookie].flat()) {
                    const cookie = tough_cookie_1.Cookie.parse(`${cookieString}`);
                    if (!cookie)
                        return;
                    this.cookiejar.setCookieSync(cookie, res.config.baseURL);
                }
            }
            return res;
        });
    }
    /**
     * Initializes the API
     */
    initialize(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { cookies, GL, HL } = options !== null && options !== void 0 ? options : {};
            if (cookies) {
                for (const cookieString of cookies.split("; ")) {
                    const cookie = tough_cookie_1.Cookie.parse(`${cookieString}`);
                    if (!cookie)
                        return;
                    this.cookiejar.setCookieSync(cookie, "https://music.youtube.com/");
                }
            }
            const html = (yield this.client.get("/")).data;
            const setConfigs = html.match(/ytcfg\.set\(.*\)/) || [];
            const configs = setConfigs
                .map(c => c.slice(10, -1))
                .map(s => {
                try {
                    return JSON.parse(s);
                }
                catch (_a) {
                    return null;
                }
            })
                .filter(j => !!j);
            for (const config of configs) {
                this.config = Object.assign(Object.assign({}, this.config), config);
            }
            if (!this.config) {
                this.config = {};
            }
            if (GL)
                this.config.GL = GL;
            if (HL)
                this.config.HL = HL;
            return this;
        });
    }
    /**
     * Constructs a basic YouTube Music API request with all essential headers
     * and body parameters needed to make the API work
     *
     * @param endpoint Endpoint for the request
     * @param body Body
     * @param query Search params
     * @returns Raw response from YouTube Music API which needs to be parsed
     */
    constructRequest(endpoint_1) {
        return tslib_1.__awaiter(this, arguments, void 0, function* (endpoint, body = {}, query = {}) {
            if (!this.config) {
                throw new Error("API not initialized. Make sure to call the initialize() method first");
            }
            const headers = Object.assign(Object.assign({}, this.client.defaults.headers), { "x-origin": this.client.defaults.baseURL, "X-Goog-Visitor-Id": this.config.VISITOR_DATA || "", "X-YouTube-Client-Name": this.config.INNERTUBE_CONTEXT_CLIENT_NAME, "X-YouTube-Client-Version": this.config.INNERTUBE_CLIENT_VERSION, "X-YouTube-Device": this.config.DEVICE, "X-YouTube-Page-CL": this.config.PAGE_CL, "X-YouTube-Page-Label": this.config.PAGE_BUILD_LABEL, "X-YouTube-Utc-Offset": String(-new Date().getTimezoneOffset()), "X-YouTube-Time-Zone": new Intl.DateTimeFormat().resolvedOptions().timeZone });
            const searchParams = new URLSearchParams(Object.assign(Object.assign({}, query), { alt: "json", key: this.config.INNERTUBE_API_KEY }));
            const res = yield this.client.post(`youtubei/${this.config.INNERTUBE_API_VERSION}/${endpoint}?${searchParams.toString()}`, Object.assign({ context: {
                    capabilities: {},
                    client: {
                        clientName: this.config.INNERTUBE_CLIENT_NAME,
                        clientVersion: this.config.INNERTUBE_CLIENT_VERSION,
                        experimentIds: [],
                        experimentsToken: "",
                        gl: this.config.GL,
                        hl: this.config.HL,
                        locationInfo: {
                            locationPermissionAuthorizationStatus: "LOCATION_PERMISSION_AUTHORIZATION_STATUS_UNSUPPORTED",
                        },
                        musicAppInfo: {
                            musicActivityMasterSwitch: "MUSIC_ACTIVITY_MASTER_SWITCH_INDETERMINATE",
                            musicLocationMasterSwitch: "MUSIC_LOCATION_MASTER_SWITCH_INDETERMINATE",
                            pwaInstallabilityStatus: "PWA_INSTALLABILITY_STATUS_UNKNOWN",
                        },
                        utcOffsetMinutes: -new Date().getTimezoneOffset(),
                    },
                    request: {
                        internalExperimentFlags: [
                            {
                                key: "force_music_enable_outertube_tastebuilder_browse",
                                value: "true",
                            },
                            {
                                key: "force_music_enable_outertube_playlist_detail_browse",
                                value: "true",
                            },
                            {
                                key: "force_music_enable_outertube_search_suggestions",
                                value: "true",
                            },
                        ],
                        sessionIndex: {},
                    },
                    user: {
                        enableSafetyMode: false,
                    },
                } }, body), {
                responseType: "json",
                headers,
            });
            return "responseContext" in res.data ? res.data : res;
        });
    }
    /**
     * Get a list of search suggestiong based on the query
     *
     * @param query Query string
     * @returns Search suggestions
     */
    getSearchSuggestions(query) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return (0, traverse_1.traverseList)(yield this.constructRequest("music/get_search_suggestions", {
                input: query,
            }), "query");
        });
    }
    /**
     * Searches YouTube Music API for results
     *
     * @param query Query string
     */
    search(query) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const searchData = yield this.constructRequest("search", {
                query,
                params: null,
            });
            return (0, traverse_1.traverseList)(searchData, "musicResponsiveListItemRenderer")
                .map(SearchParser_1.default.parse)
                .filter(Boolean);
        });
    }
    /**
     * Searches YouTube Music API for songs
     *
     * @param query Query string
     */
    searchSongs(query) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const searchData = yield this.constructRequest("search", {
                query,
                params: "Eg-KAQwIARAAGAAgACgAMABqChAEEAMQCRAFEAo%3D",
            });
            return (0, traverse_1.traverseList)(searchData, "musicResponsiveListItemRenderer").map(SongParser_1.default.parseSearchResult);
        });
    }
    /**
     * Searches YouTube Music API for videos
     *
     * @param query Query string
     */
    searchVideos(query) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const searchData = yield this.constructRequest("search", {
                query,
                params: "Eg-KAQwIABABGAAgACgAMABqChAEEAMQCRAFEAo%3D",
            });
            return (0, traverse_1.traverseList)(searchData, "musicResponsiveListItemRenderer").map(VideoParser_1.default.parseSearchResult);
        });
    }
    /**
     * Searches YouTube Music API for artists
     *
     * @param query Query string
     */
    searchArtists(query) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const searchData = yield this.constructRequest("search", {
                query,
                params: "Eg-KAQwIABAAGAAgASgAMABqChAEEAMQCRAFEAo%3D",
            });
            return (0, traverse_1.traverseList)(searchData, "musicResponsiveListItemRenderer").map(ArtistParser_1.default.parseSearchResult);
        });
    }
    /**
     * Searches YouTube Music API for albums
     *
     * @param query Query string
     */
    searchAlbums(query) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const searchData = yield this.constructRequest("search", {
                query,
                params: "Eg-KAQwIABAAGAEgACgAMABqChAEEAMQCRAFEAo%3D",
            });
            return (0, traverse_1.traverseList)(searchData, "musicResponsiveListItemRenderer").map(AlbumParser_1.default.parseSearchResult);
        });
    }
    /**
     * Searches YouTube Music API for playlists
     *
     * @param query Query string
     */
    searchPlaylists(query) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const searchData = yield this.constructRequest("search", {
                query,
                params: "Eg-KAQwIABAAGAAgACgBMABqChAEEAMQCRAFEAo%3D",
            });
            return (0, traverse_1.traverseList)(searchData, "musicResponsiveListItemRenderer").map(PlaylistParser_1.default.parseSearchResult);
        });
    }
    /**
     * Get all possible information of a Song
     *
     * @param videoId Video ID
     * @returns Song Data
     */
    getSong(videoId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!videoId.match(/^[a-zA-Z0-9-_]{11}$/))
                throw new Error("Invalid videoId");
            const data = yield this.constructRequest("player", { videoId });
            const song = SongParser_1.default.parse(data);
            if (song.videoId !== videoId)
                throw new Error("Invalid videoId");
            return song;
        });
    }
    /**
     * Get all possible information of a Video
     *
     * @param videoId Video ID
     * @returns Video Data
     */
    getVideo(videoId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!videoId.match(/^[a-zA-Z0-9-_]{11}$/))
                throw new Error("Invalid videoId");
            const data = yield this.constructRequest("player", { videoId });
            const video = VideoParser_1.default.parse(data);
            if (video.videoId !== videoId)
                throw new Error("Invalid videoId");
            return video;
        });
    }
    /**
     * Get lyrics of a specific Song
     *
     * @param videoId Video ID
     * @returns Lyrics
     */
    getLyrics(videoId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!videoId.match(/^[a-zA-Z0-9-_]{11}$/))
                throw new Error("Invalid videoId");
            const data = yield this.constructRequest("next", { videoId });
            const browseId = (0, traverse_1.traverse)((0, traverse_1.traverseList)(data, "tabs", "tabRenderer")[1], "browseId");
            const lyricsData = yield this.constructRequest("browse", { browseId });
            const lyrics = (0, traverse_1.traverseString)(lyricsData, "description", "runs", "text");
            return lyrics
                ? lyrics
                    .replaceAll("\r", "")
                    .split("\n")
                    .filter(v => !!v)
                : null;
        });
    }
    /**
     * Get all possible information of an Artist
     *
     * @param artistId Artist ID
     * @returns Artist Data
     */
    getArtist(artistId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const data = yield this.constructRequest("browse", {
                browseId: artistId,
            });
            return ArtistParser_1.default.parse(data, artistId);
        });
    }
    /**
     * Get all of Artist's Songs
     *
     * @param artistId Artist ID
     * @returns Artist's Songs
     */
    getArtistSongs(artistId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const artistData = yield this.constructRequest("browse", { browseId: artistId });
            const browseToken = (0, traverse_1.traverse)(artistData, "musicShelfRenderer", "title", "browseId");
            if (browseToken instanceof Array)
                return [];
            const songsData = yield this.constructRequest("browse", { browseId: browseToken });
            const continueToken = (0, traverse_1.traverse)(songsData, "continuation");
            const moreSongsData = yield this.constructRequest("browse", {}, { continuation: continueToken });
            return [
                ...(0, traverse_1.traverseList)(songsData, "musicResponsiveListItemRenderer"),
                ...(0, traverse_1.traverseList)(moreSongsData, "musicResponsiveListItemRenderer"),
            ].map(s => SongParser_1.default.parseArtistSong(s, {
                artistId,
                name: (0, traverse_1.traverseString)(artistData, "header", "title", "text"),
            }));
        });
    }
    /**
     * Get all of Artist's Albums
     *
     * @param artistId Artist ID
     * @returns Artist's Albums
     */
    getArtistAlbums(artistId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const artistData = yield this.constructRequest("browse", {
                browseId: artistId,
            });
            const artistAlbumsData = (0, traverse_1.traverseList)(artistData, "musicCarouselShelfRenderer")[0];
            const browseBody = (0, traverse_1.traverse)(artistAlbumsData, "moreContentButton", "browseEndpoint");
            const albumsData = yield this.constructRequest("browse", browseBody);
            return (0, traverse_1.traverseList)(albumsData, "musicTwoRowItemRenderer").map(item => AlbumParser_1.default.parseArtistAlbum(item, {
                artistId,
                name: (0, traverse_1.traverseString)(albumsData, "header", "runs", "text"),
            }));
        });
    }
    /**
     * Get all possible information of an Album
     *
     * @param albumId Album ID
     * @returns Album Data
     */
    getAlbum(albumId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const data = yield this.constructRequest("browse", {
                browseId: albumId,
            });
            return AlbumParser_1.default.parse(data, albumId);
        });
    }
    /**
     * Get all possible information of a Playlist except the tracks
     *
     * @param playlistId Playlist ID
     * @returns Playlist Data
     */
    getPlaylist(playlistId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (playlistId.startsWith("PL"))
                playlistId = "VL" + playlistId;
            const data = yield this.constructRequest("browse", {
                browseId: playlistId,
            });
            return PlaylistParser_1.default.parse(data, playlistId);
        });
    }
    /**
     * Get all videos in a Playlist
     *
     * @param playlistId Playlist ID
     * @returns Playlist's Videos
     */
    getPlaylistVideos(playlistId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (playlistId.startsWith("PL"))
                playlistId = "VL" + playlistId;
            const playlistData = yield this.constructRequest("browse", {
                browseId: playlistId,
            });
            const songs = (0, traverse_1.traverseList)(playlistData, "musicPlaylistShelfRenderer", "musicResponsiveListItemRenderer");
            let continuation = (0, traverse_1.traverse)(playlistData, "continuation");
            while (!(continuation instanceof Array)) {
                const songsData = yield this.constructRequest("browse", {}, { continuation });
                songs.push(...(0, traverse_1.traverseList)(songsData, "musicResponsiveListItemRenderer"));
                continuation = (0, traverse_1.traverse)(songsData, "continuation");
            }
            return songs.map(VideoParser_1.default.parsePlaylistVideo);
        });
    }
    /**
     * Get content for the home page.
     *
     * @returns Mixed HomePageContent
     */
    getHome() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const results = [];
            const page = yield this.constructRequest("browse", { browseId: constants_1.FE_MUSIC_HOME });
            (0, traverse_1.traverseList)(page, "sectionListRenderer", "contents").forEach(content => {
                const parsed = Parser_1.default.parseMixedContent(content);
                parsed && results.push(parsed);
            });
            let continuation = (0, traverse_1.traverseString)(page, "continuation");
            while (continuation) {
                const nextPage = yield this.constructRequest("browse", {}, { continuation });
                (0, traverse_1.traverseList)(nextPage, "sectionListContinuation", "contents").forEach(content => {
                    const parsed = Parser_1.default.parseMixedContent(content);
                    parsed && results.push(parsed);
                });
                continuation = (0, traverse_1.traverseString)(nextPage, "continuation");
            }
            return results;
        });
    }
    /**
     * Get content for next song.
     *
     * @param videoId Video ID
     * @param playlistId Playlist ID
     * @param paramString
     *
     * @returns List of the next song
     */
    getNext(videoId, playlistId, paramString) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const data = yield this.constructRequest("next", {
                enablePersistentPlaylistPanel: true,
                isAudioOnly: true,
                params: paramString,
                playlistId: playlistId,
                tunerSettingValue: "AUTOMIX_SETTING_NORMAL",
                videoId: videoId,
            });
            const contents = (0, traverse_1.traverse)((0, traverse_1.traverseList)(data, "tabs", "tabRenderer")[0], "contents");
            return contents.map(NextParser_1.default.parse);
        });
    }
}
exports.default = YTMusic;
