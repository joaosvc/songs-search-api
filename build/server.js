"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const server_router_1 = tslib_1.__importDefault(require("./router/server-router"));
const dotenv_1 = require("dotenv");
const spotify_1 = tslib_1.__importDefault(require("./providers/audio/spotify"));
const ytmusic_1 = tslib_1.__importDefault(require("./providers/audio/ytmusic"));
const main = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    (0, dotenv_1.config)();
    const server = {
        app: (0, express_1.default)(),
        port: process.env.SERVER_PORT || 8000,
    };
    yield Promise.all([
        spotify_1.default.initialize(process.env.SPOTIFY_CLIENT_ID || "", process.env.SPOTIFY_CLIENT_SECRET || ""),
        ytmusic_1.default.initialize(),
    ]);
    const [spotifyConnection, youtubeConnection] = yield Promise.all([
        spotify_1.default.validateConnection(),
        ytmusic_1.default.validateConnection(),
    ]);
    if (!spotifyConnection) {
        return console.log("You are blocked by Spotify. Please use a VPN, change spotify to piped, or use other audio providers");
    }
    if (!youtubeConnection) {
        return console.log("You are blocked by YouTube Music. Please use a VPN, change youtube-music to piped, or use other audio providers");
    }
    server.app.use(server_router_1.default);
    server.app.listen(server.port, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return console.log(`listening on port ${server.port}!`); }));
});
main();
