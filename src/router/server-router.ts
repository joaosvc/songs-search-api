import express from "express";
import { Router } from "express";
import cors, { CorsOptions } from "cors";
import { GetSearchSongsController } from "../controllers/search-songs/search-songs";
import { GetPlaylistSongsController } from "../controllers/playlist-songs/playlist-songs";
import { GetAlbumSongsController } from "../controllers/album-songs/album-songs";
import { GetArtistAlbumsController } from "../controllers/artist-albums/artist-albums";
import { GetSimpleLinkController } from "../controllers/simple-link/simple-link";
import { GetAudioFormatsController } from "../controllers/audio-formats/audio-formats";

const serverRouter: Router = Router();
const corsOptions: CorsOptions = {
  origin: "*",
  methods: "GET, POST",
  optionsSuccessStatus: 204,
};

serverRouter.use(
  [
    "/search-songs",
    "/search-playlist-songs",
    "/search-album-songs",
    "/simple-link",
    "/audio-formats",
  ],
  cors(corsOptions),
  express.json()
);

serverRouter.post("/search-songs", async (req, res) => {
  const getSearchSongsController = new GetSearchSongsController();

  const { body, statusCode } = await getSearchSongsController.handle({
    body: req.body,
  });

  res.status(statusCode).send(body);
});

serverRouter.post("/search-playlist-songs", async (req, res) => {
  const getPlaylistSongsController = new GetPlaylistSongsController();

  const { body, statusCode } = await getPlaylistSongsController.handle({
    body: req.body,
  });

  res.status(statusCode).send(body);
});

serverRouter.post("/search-album-songs", async (req, res) => {
  const getAlbumSongsController = new GetAlbumSongsController();

  const { body, statusCode } = await getAlbumSongsController.handle({
    body: req.body,
  });

  res.status(statusCode).send(body);
});

serverRouter.post("/search-artist-albums", async (req, res) => {
  const getArtistAlbumsController = new GetArtistAlbumsController();

  const { body, statusCode } = await getArtistAlbumsController.handle({
    body: req.body,
  });

  res.status(statusCode).send(body);
});

serverRouter.post("/simple-link", async (req, res) => {
  const getSimpleLinkController = new GetSimpleLinkController();

  const { body, statusCode } = await getSimpleLinkController.handle({
    body: req.body,
  });

  res.status(statusCode).send(body);
});

serverRouter.post("/audio-formats", async (req, res) => {
  const getAudioFormatsController = new GetAudioFormatsController();

  const { body, statusCode } = await getAudioFormatsController.handle({
    body: req.body,
  });

  res.status(statusCode).send(body);
});

export default serverRouter;
