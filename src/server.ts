import express from "express";
import serverRouter from "./router/server-router";
import { config as readEnvConfig } from "dotenv";
import Spotify from "./providers/audio/spotify";
import YoutubeMusic from "./providers/audio/ytmusic";

const main = async () => {
  readEnvConfig();

  const server = {
    app: express(),
    port: process.env.SERVER_PORT || 8000,
  };

  await Promise.all([
    Spotify.initialize(
      process.env.SPOTIFY_CLIENT_ID || "",
      process.env.SPOTIFY_CLIENT_SECRET || ""
    ),
    YoutubeMusic.initialize(),
  ]);

  const [spotifyConnection, youtubeConnection] = await Promise.all([
    Spotify.validateConnection(),
    YoutubeMusic.validateConnection(),
  ]);

  if (!spotifyConnection) {
    return console.log(
      "You are blocked by Spotify. Please use a VPN, change spotify to piped, or use other audio providers"
    );
  }

  if (!youtubeConnection) {
    return console.log(
      "You are blocked by YouTube Music. Please use a VPN, change youtube-music to piped, or use other audio providers"
    );
  }

  server.app.use(serverRouter);

  server.app.listen(server.port, async () =>
    console.log(`listening on port ${server.port}!`)
  );
};

main();
