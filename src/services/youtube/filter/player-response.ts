import { YoutubeUnrecoverableError } from "../error/unrecoverable-error";
import { parseJSON } from "../../../utils/json-parser";
import { PlayerResponse, VideoFormat, VideoInfo } from "../@types/types";

export default class FilterPlayerResponse {
  public static validate(info: VideoInfo) {
    let playErr = this.playError(
      info.player_response,
      ["UnrecoverableError"],
      YoutubeUnrecoverableError
    );
    let privateErr = this.privateVideoError(info.player_response);
    if (playErr || privateErr) {
      throw playErr || privateErr;
    }
    return (
      info &&
      info.player_response &&
      (info.player_response.streamingData ||
        this.isRental(info.player_response) ||
        this.isNotYetBroadcasted(info.player_response))
    );
  }

  public static playError(
    player_response: PlayerResponse | null,
    statuses: string[],
    YoutubeUnrecoverableErrorType = YoutubeUnrecoverableError
  ) {
    const playability = player_response && player_response.playabilityStatus;

    if (playability && statuses.includes(playability.status)) {
      return new YoutubeUnrecoverableErrorType(
        playability.reason || (playability.messages && playability.messages[0])
      );
    }
    return null;
  }

  public static privateVideoError(player_response: PlayerResponse) {
    const playability = player_response && player_response.playabilityStatus;

    if (
      playability &&
      playability.status === "LOGIN_REQUIRED" &&
      playability.messages &&
      playability.messages.filter((m) => /Youtube is a private video/.test(m))
        .length
    ) {
      return new YoutubeUnrecoverableError(
        playability.reason || (playability.messages && playability.messages[0])
      );
    } else {
      return null;
    }
  }

  public static isRental(player_response: PlayerResponse) {
    const playability = player_response.playabilityStatus;

    return (
      playability &&
      playability.status === "UNPLAYABLE" &&
      playability.errorScreen &&
      playability.errorScreen.playerLegacyDesktopYpcOfferRenderer
    );
  }

  public static isNotYetBroadcasted(player_response: any) {
    const playability = player_response.playabilityStatus;
    return playability && playability.status === "LIVE_STREAM_OFFLINE";
  }

  public static parseFormats(player_response: PlayerResponse): VideoFormat[] {
    let formats: any[] = [];

    if (player_response && player_response.streamingData) {
      formats = formats
        .concat(player_response.streamingData.formats || [])
        .concat(player_response.streamingData.adaptiveFormats || []);
    }
    return formats;
  }

  public static findPlayerResponse(source: string, info: any) {
    const player_response =
      info &&
      ((info.args && info.args.player_response) ||
        info.player_response ||
        info.playerResponse ||
        info.embedded_player_response);
    return parseJSON(source, "player_response", player_response);
  }

  public static getHTML5player(body: any) {
    let html5playerRes =
      /<script\s+src="([^"]+)"(?:\s+type="text\/javascript")?\s+name="player_ias\/base"\s*>|"jsUrl":"([^"]+)"/.exec(
        body
      );
    return html5playerRes ? html5playerRes[1] || html5playerRes[2] : null;
  }
}
