"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const express_2 = require("express");
const cors_1 = tslib_1.__importDefault(require("cors"));
const search_songs_1 = require("../controllers/search-songs/search-songs");
const playlist_songs_1 = require("../controllers/playlist-songs/playlist-songs");
const album_songs_1 = require("../controllers/album-songs/album-songs");
const artist_albums_1 = require("../controllers/artist-albums/artist-albums");
const simple_link_1 = require("../controllers/simple-link/simple-link");
const serverRouter = (0, express_2.Router)();
const corsOptions = {
    origin: "*",
    methods: "GET, POST",
    optionsSuccessStatus: 204,
};
serverRouter.use([
    "/search-songs",
    "/search-playlist-songs",
    "/search-album-songs",
    "/simple-link",
], (0, cors_1.default)(corsOptions), express_1.default.json());
serverRouter.post("/search-songs", (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const getSearchSongsController = new search_songs_1.GetSearchSongsController();
    const { body, statusCode } = yield getSearchSongsController.handle({
        body: req.body,
    });
    res.status(statusCode).send(body);
}));
serverRouter.post("/search-playlist-songs", (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const getPlaylistSongsController = new playlist_songs_1.GetPlaylistSongsController();
    const { body, statusCode } = yield getPlaylistSongsController.handle({
        body: req.body,
    });
    res.status(statusCode).send(body);
}));
serverRouter.post("/search-album-songs", (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const getAlbumSongsController = new album_songs_1.GetAlbumSongsController();
    const { body, statusCode } = yield getAlbumSongsController.handle({
        body: req.body,
    });
    res.status(statusCode).send(body);
}));
serverRouter.post("/search-artist-albums", (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const getArtistAlbumsController = new artist_albums_1.GetArtistAlbumsController();
    const { body, statusCode } = yield getArtistAlbumsController.handle({
        body: req.body,
    });
    res.status(statusCode).send(body);
}));
serverRouter.post("/simple-link", (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const getSimpleLinkController = new simple_link_1.GetSimpleLinkController();
    const { body, statusCode } = yield getSimpleLinkController.handle({
        body: req.body,
    });
    res.status(statusCode).send(body);
}));
exports.default = serverRouter;
