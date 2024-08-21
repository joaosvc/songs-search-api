import {
  FullSimpleLinkMetadata,
  SimpleLinkMetadata,
  Song,
} from "../../@types/types";
import { badRequest, ok, serverError } from "../helpers";
import { HttpRequest, HttpResponse, IController } from "../protocols";
import { GetFullSearchSongsParams } from "./protocols";
import Parser from "../../utils/search/parser";
import YoutubeSearch from "../../models/youtube-search";

export class GetFullSearchSongsController implements IController {
  async handle(
    httpRequest: HttpRequest<GetFullSearchSongsParams>
  ): Promise<HttpResponse<FullSimpleLinkMetadata | string>> {
    try {
      const searchQuery = String(httpRequest?.params?.searchQuery!);

      if (!searchQuery) {
        return badRequest("Missing searchQuery");
      }

      const songs = await Parser.searchAllSongs(searchQuery);

      const processedSongs = <SimpleLinkMetadata[]>(
        (
          await Promise.all(
            songs.map((song: Song) => YoutubeSearch.fromParams(song))
          )
        ).filter((song) => song.success && song.link)
      );

      return ok({
        links: processedSongs,
      });
    } catch (error) {
      if (error instanceof Error) {
        return badRequest(error.message);
      } else {
        console.error(error);
        return serverError();
      }
    }
  }
}
